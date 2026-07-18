-- =========================================================================
-- Migration: Fix RLS recursion on users and enable quiz_questions insertion
-- standardizes admin checks with a SECURITY DEFINER function to avoid RLS loops 
-- and allows authenticated users to save questions for their own quizzes.
-- =========================================================================

BEGIN;

-- 1. Create is_admin helper with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
      AND role = 'admin'::public.user_role_enum
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Drop and recreate Admins read all credentials policy on users
DROP POLICY IF EXISTS "Admins read all credentials" ON public.users;
CREATE POLICY "Admins read all credentials" ON public.users FOR SELECT USING (public.is_admin());

-- 3. Drop and recreate Admins manage all quiz questions policy
DROP POLICY IF EXISTS "Admins manage all quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins manage all quiz questions" ON public.quiz_questions FOR ALL USING (public.is_admin());

-- 4. Create policy to allow users to insert/update/delete quiz questions they own
DROP POLICY IF EXISTS "Users manage own quiz questions" ON public.quiz_questions;
CREATE POLICY "Users manage own quiz questions" ON public.quiz_questions FOR ALL USING (EXISTS (
  SELECT 1 FROM public.quizzes q 
  WHERE q.id = quiz_id 
    AND q.user_id = auth.uid()
));

COMMIT;
