-- Backfill group_id in historical study sessions using the subject's group.
UPDATE public.study_sessions AS ss
SET group_id = s.group_id
FROM public.subjects AS s
WHERE ss.subject_id = s.id
  AND ss.group_id IS NULL;

-- Ensure relevant progress tables are in realtime publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'goals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_points'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
  END IF;
END
$$;
