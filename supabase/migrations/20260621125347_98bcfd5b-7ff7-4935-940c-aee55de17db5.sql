-- Lock down all custom auth/PII tables explicitly. All app access goes through
-- server functions using the service role (which bypasses RLS). We revoke any
-- Data API access from anon/authenticated and add restrictive deny-all policies
-- so that even if grants are accidentally re-added, no row is ever exposed.

REVOKE ALL ON public.staff_users FROM anon, authenticated;
REVOKE ALL ON public.students FROM anon, authenticated;
REVOKE ALL ON public.alumni_registrations FROM anon, authenticated;
REVOKE ALL ON public.contact_submissions FROM anon, authenticated;
REVOKE ALL ON public.study_materials FROM anon, authenticated;
REVOKE ALL ON public.faculty FROM anon, authenticated;
REVOKE ALL ON public.departments FROM anon, authenticated;
REVOKE ALL ON public.notices FROM anon, authenticated;
REVOKE ALL ON public.events FROM anon, authenticated;

GRANT ALL ON public.staff_users TO service_role;
GRANT ALL ON public.students TO service_role;
GRANT ALL ON public.alumni_registrations TO service_role;
GRANT ALL ON public.contact_submissions TO service_role;
GRANT ALL ON public.study_materials TO service_role;
GRANT ALL ON public.faculty TO service_role;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.notices TO service_role;
GRANT ALL ON public.events TO service_role;

-- Explicit deny-all policies for anon and authenticated on every sensitive table.
-- Service role bypasses RLS, so server functions continue to work.

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'staff_users','students','alumni_registrations','contact_submissions',
    'study_materials','faculty','departments','notices','events'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "deny_all_anon" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "deny_all_authenticated" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "deny_all_anon" ON public.%I AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false)', t);
    EXECUTE format(
      'CREATE POLICY "deny_all_authenticated" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;