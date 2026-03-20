-- Minimal persistence for generated tests history
-- Adds only the tables required to save generated tests and their questions.

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

CREATE INDEX IF NOT EXISTS idx_tests_user_created_at
  ON public.tests(user_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_test_questions_test_position
  ON public.test_questions(test_id, position);

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
