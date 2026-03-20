-- Minimal Supabase structure required for the AI test generator flow.
-- This script intentionally does NOT recreate the full GrupoEstuda schema.
-- It only provides the pieces that the current "Criar Teste" flow actually uses:
--   1) Supabase Auth users
--   2) public.profiles with the "plan" field
--   3) public.tests and public.test_questions for saved history
--   4) RLS so authenticated users can access only their own records
--   5) Optional storage bucket for uploaded study materials

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- TEST HISTORY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  subject_names TEXT[] NOT NULL DEFAULT '{}',
  source_file_url TEXT,
  questions_count INTEGER NOT NULL DEFAULT 0 CHECK (questions_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tests" ON public.tests;
CREATE POLICY "Users can view their own tests"
ON public.tests
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tests" ON public.tests;
CREATE POLICY "Users can create their own tests"
ON public.tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tests" ON public.tests;
CREATE POLICY "Users can update their own tests"
ON public.tests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tests" ON public.tests;
CREATE POLICY "Users can delete their own tests"
ON public.tests
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_tests_updated_at ON public.tests;
CREATE TRIGGER update_tests_updated_at
BEFORE UPDATE ON public.tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  context TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_id, position)
);

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view questions from their own tests" ON public.test_questions;
CREATE POLICY "Users can view questions from their own tests"
ON public.test_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tests
    WHERE tests.id = test_questions.test_id
      AND tests.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert questions into their own tests" ON public.test_questions;
CREATE POLICY "Users can insert questions into their own tests"
ON public.test_questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tests
    WHERE tests.id = test_questions.test_id
      AND tests.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete questions from their own tests" ON public.test_questions;
CREATE POLICY "Users can delete questions from their own tests"
ON public.test_questions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.tests
    WHERE tests.id = test_questions.test_id
      AND tests.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- OPTIONAL STORAGE FOR FILE UPLOADS USED BY THE GENERATOR
-- Only required when the upload/PDF-TXT flow is enabled.
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload study materials" ON storage.objects;
CREATE POLICY "Users can upload study materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'study-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view study materials" ON storage.objects;
CREATE POLICY "Public can view study materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Users can delete own study materials" ON storage.objects;
CREATE POLICY "Users can delete own study materials"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'study-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
