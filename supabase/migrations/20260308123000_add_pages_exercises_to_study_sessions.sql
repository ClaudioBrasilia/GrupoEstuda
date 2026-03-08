-- Situação B: suporta dados reais de páginas/exercícios em study_sessions,
-- mantendo fallback seguro por duração para sessões antigas/sem esses campos.

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS pages INTEGER,
  ADD COLUMN IF NOT EXISTS exercises INTEGER;

ALTER TABLE public.study_sessions
  DROP CONSTRAINT IF EXISTS study_sessions_pages_non_negative,
  DROP CONSTRAINT IF EXISTS study_sessions_exercises_non_negative;

ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_pages_non_negative CHECK (pages IS NULL OR pages >= 0),
  ADD CONSTRAINT study_sessions_exercises_non_negative CHECK (exercises IS NULL OR exercises >= 0);

-- Recria função com prioridade para valores reais (pages/exercises)
-- e fallback para estimativa baseada em duração quando ausentes.
CREATE OR REPLACE FUNCTION public.update_goals_from_study_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record record;
  session_time integer;
  session_pages integer;
  session_exercises integer;
BEGIN
  -- Processa apenas quando a sessão é finalizada pela primeira vez.
  IF TG_OP = 'INSERT' THEN
    IF NEW.completed_at IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.completed_at IS NULL OR OLD.completed_at IS NOT NULL THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Sem group_id não há pontuação/meta de grupo para atualizar.
  IF NEW.group_id IS NULL THEN
    RETURN NEW;
  END IF;

  session_time := COALESCE(NEW.duration_minutes, 0);
  session_pages := COALESCE(NEW.pages, session_time / 5);
  session_exercises := COALESCE(NEW.exercises, session_time / 10);

  -- Pontos: 1 ponto por minuto, uma única vez por sessão, no escopo correto do usuário e grupo.
  IF session_time > 0 THEN
    INSERT INTO public.user_points (user_id, group_id, points)
    VALUES (NEW.user_id, NEW.group_id, session_time)
    ON CONFLICT (user_id, group_id)
    DO UPDATE SET
      points = public.user_points.points + EXCLUDED.points,
      updated_at = now();
  END IF;

  -- Metas: atualiza somente metas do MESMO grupo da sessão.
  -- Se houver subject_id na sessão, exige subject correspondente ou meta geral (subject_id NULL).
  FOR goal_record IN
    SELECT g.id, g.type, g.target
    FROM public.goals g
    WHERE g.group_id = NEW.group_id
      AND (
        (NEW.subject_id IS NULL AND g.subject_id IS NULL)
        OR (NEW.subject_id IS NOT NULL AND (g.subject_id = NEW.subject_id OR g.subject_id IS NULL))
      )
      AND (
        g.type = 'time'
        OR (g.type = 'exercises' AND session_exercises > 0)
        OR (g.type = 'pages' AND session_pages > 0)
      )
  LOOP
    UPDATE public.goals
    SET
      current = LEAST(
        target,
        current + CASE
          WHEN goal_record.type = 'time' THEN session_time
          WHEN goal_record.type = 'exercises' THEN session_exercises
          WHEN goal_record.type = 'pages' THEN session_pages
          ELSE 0
        END
      ),
      updated_at = now()
    WHERE id = goal_record.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Garante trigger único para evitar duplicidade legado/novo.
DROP TRIGGER IF EXISTS update_goals_trigger ON public.study_sessions;
DROP TRIGGER IF EXISTS trigger_update_goals_from_study_sessions ON public.study_sessions;
DROP TRIGGER IF EXISTS sync_goals_points_from_study_sessions ON public.study_sessions;

CREATE TRIGGER sync_goals_points_from_study_sessions
AFTER INSERT OR UPDATE ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_goals_from_study_sessions();
