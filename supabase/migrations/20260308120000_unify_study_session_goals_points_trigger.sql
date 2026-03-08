-- Unifica a escrita de metas/pontos derivadas de study_sessions em UM único trigger.
-- Objetivo: evitar dupla/tripla contabilização e garantir escopo correto por user_id + group_id.

-- Remove triggers legados que podem coexistir e gerar execução duplicada.
DROP TRIGGER IF EXISTS update_goals_trigger ON public.study_sessions;
DROP TRIGGER IF EXISTS trigger_update_goals_from_study_sessions ON public.study_sessions;
DROP TRIGGER IF EXISTS sync_goals_points_from_study_sessions ON public.study_sessions;

-- Substitui a função por uma versão com escopo explícito.
CREATE OR REPLACE FUNCTION public.update_goals_from_study_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record record;
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

  -- Pontos: 1 ponto por minuto, uma única vez por sessão, no escopo correto do usuário e grupo.
  IF COALESCE(NEW.duration_minutes, 0) > 0 THEN
    INSERT INTO public.user_points (user_id, group_id, points)
    VALUES (NEW.user_id, NEW.group_id, NEW.duration_minutes)
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
        OR (g.type = 'exercises' AND COALESCE(NEW.duration_minutes, 0) >= 10)
        OR (g.type = 'pages' AND COALESCE(NEW.duration_minutes, 0) >= 5)
      )
  LOOP
    UPDATE public.goals
    SET
      current = LEAST(
        target,
        current + CASE
          WHEN goal_record.type = 'time' THEN COALESCE(NEW.duration_minutes, 0)
          WHEN goal_record.type = 'exercises' THEN (COALESCE(NEW.duration_minutes, 0) / 10)
          WHEN goal_record.type = 'pages' THEN (COALESCE(NEW.duration_minutes, 0) / 5)
          ELSE 0
        END
      ),
      updated_at = now()
    WHERE id = goal_record.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger único oficial.
CREATE TRIGGER sync_goals_points_from_study_sessions
AFTER INSERT OR UPDATE ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_goals_from_study_sessions();
