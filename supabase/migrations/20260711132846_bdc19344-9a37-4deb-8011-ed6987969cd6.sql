
DROP POLICY IF EXISTS "authenticated read weekly plans" ON public.weekly_lesson_plans;
DROP POLICY IF EXISTS "authenticated write weekly plans" ON public.weekly_lesson_plans;

REVOKE ALL ON public.weekly_lesson_plans FROM authenticated, anon;
REVOKE ALL ON SEQUENCE public.weekly_lesson_plans_id_seq FROM authenticated, anon;

CREATE POLICY "deny_all_anon_wlp" ON public.weekly_lesson_plans AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated_wlp" ON public.weekly_lesson_plans AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
