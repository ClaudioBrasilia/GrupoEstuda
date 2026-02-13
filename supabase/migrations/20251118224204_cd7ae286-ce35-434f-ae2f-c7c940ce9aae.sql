-- Create study_activities table
CREATE TABLE IF NOT EXISTS public.study_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_activities_group ON public.study_activities(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_activities_user ON public.study_activities(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.study_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_activities
CREATE POLICY "Members can create activities"
ON public.study_activities FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  group_id IN (SELECT get_user_groups(auth.uid()))
);

CREATE POLICY "Members can view group activities"
ON public.study_activities FOR SELECT
USING (group_id IN (SELECT get_user_groups(auth.uid())));

CREATE POLICY "Users can update their activities"
ON public.study_activities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their activities"
ON public.study_activities FOR DELETE
USING (auth.uid() = user_id);

-- Create study_activity_likes table
CREATE TABLE IF NOT EXISTS public.study_activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.study_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Create index for likes
CREATE INDEX IF NOT EXISTS idx_activity_likes ON public.study_activity_likes(activity_id);

-- Enable RLS
ALTER TABLE public.study_activity_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Members can like activities"
ON public.study_activity_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view likes"
ON public.study_activity_likes FOR SELECT
USING (true);

CREATE POLICY "Users can remove their likes"
ON public.study_activity_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for study activities
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-activities', 'study-activities', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Members can upload activity photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-activities' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Members can view activity photos in their groups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'study-activities' AND
  EXISTS (
    SELECT 1 FROM public.study_activities sa
    WHERE sa.photo_path = name
    AND sa.group_id IN (SELECT get_user_groups(auth.uid()))
  )
);

CREATE POLICY "Users can delete their activity photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-activities' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to add user points
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id UUID,
  p_group_id UUID,
  p_points INTEGER
) RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, group_id, points)
  VALUES (p_user_id, p_group_id, p_points)
  ON CONFLICT (user_id, group_id)
  DO UPDATE SET 
    points = user_points.points + p_points,
    updated_at = now();
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_study_activities_updated_at
BEFORE UPDATE ON public.study_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();