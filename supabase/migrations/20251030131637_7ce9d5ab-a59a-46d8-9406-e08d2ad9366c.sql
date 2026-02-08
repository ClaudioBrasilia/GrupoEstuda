-- Create achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_key text NOT NULL UNIQUE,
  description_key text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  points_required integer,
  groups_required integer,
  sessions_required integer,
  water_days_required integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

-- Insert initial achievements
INSERT INTO public.achievements (name_key, description_key, icon, category, points_required) VALUES
  ('studyWarrior', 'studyWarriorDesc', '⚔️', 'points', 100),
  ('knowledgeSeeker', 'knowledgeSeekerDesc', '📚', 'points', 500),
  ('problemSolver', 'problemSolverDesc', '🧩', 'points', 1000),
  ('studyMaster', 'studyMasterDesc', '🎓', 'points', 2500),
  ('studyLegend', 'studyLegendDesc', '👑', 'points', 5000);

INSERT INTO public.achievements (name_key, description_key, icon, category, groups_required) VALUES
  ('groupLeader', 'groupLeaderDesc', '👥', 'groups', 1),
  ('socialButterfly', 'socialButterflyDesc', '🦋', 'groups', 3),
  ('communityBuilder', 'communityBuilderDesc', '🏗️', 'groups', 5);

INSERT INTO public.achievements (name_key, description_key, icon, category, sessions_required) VALUES
  ('consistent', 'consistentDesc', '📅', 'sessions', 7),
  ('dedicated', 'dedicatedDesc', '💪', 'sessions', 30),
  ('unstoppable', 'unstoppableDesc', '🔥', 'sessions', 100);

INSERT INTO public.achievements (name_key, description_key, icon, category, water_days_required) VALUES
  ('hydrationMaster', 'hydrationMasterDesc', '💧', 'water', 7),
  ('waterChampion', 'waterChampionDesc', '🌊', 'water', 30);