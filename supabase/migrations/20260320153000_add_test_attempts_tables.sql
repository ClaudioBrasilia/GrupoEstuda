-- Persist user attempts and answers for generated tests review/history

CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  score_percentage INTEGER NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_test_created_at
  ON public.test_attempts(test_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_created_at
  ON public.test_attempts(user_id, created_at DESC);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own test attempts" ON public.test_attempts;
CREATE POLICY "Users can view their own test attempts"
ON public.test_attempts
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own test attempts" ON public.test_attempts;
CREATE POLICY "Users can create their own test attempts"
ON public.test_attempts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.tests
    WHERE tests.id = test_attempts.test_id
      AND tests.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.test_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  test_question_id UUID NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, test_question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_attempt_answers_attempt
  ON public.test_attempt_answers(attempt_id);

ALTER TABLE public.test_attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view answers from their own test attempts" ON public.test_attempt_answers;
CREATE POLICY "Users can view answers from their own test attempts"
ON public.test_attempt_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.test_attempts
    WHERE test_attempts.id = test_attempt_answers.attempt_id
      AND test_attempts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert answers into their own test attempts" ON public.test_attempt_answers;
CREATE POLICY "Users can insert answers into their own test attempts"
ON public.test_attempt_answers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.test_attempts
    WHERE test_attempts.id = test_attempt_answers.attempt_id
      AND test_attempts.user_id = auth.uid()
  )
);
