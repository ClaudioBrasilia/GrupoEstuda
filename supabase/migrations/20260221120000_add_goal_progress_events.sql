CREATE TABLE IF NOT EXISTS public.goal_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('time', 'pages', 'exercises')),
  delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_progress_events_user_created_at
  ON public.goal_progress_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_goal_progress_events_group_created_at
  ON public.goal_progress_events(group_id, created_at DESC);

ALTER TABLE public.goal_progress_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own goal progress events" ON public.goal_progress_events;
CREATE POLICY "Users can insert their own goal progress events"
ON public.goal_progress_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read goal progress events from their groups" ON public.goal_progress_events;
CREATE POLICY "Users can read goal progress events from their groups"
ON public.goal_progress_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    group_id IS NOT NULL
    AND group_id IN (SELECT public.get_user_groups(auth.uid()))
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'goal_progress_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_progress_events;
  END IF;
END $$;
