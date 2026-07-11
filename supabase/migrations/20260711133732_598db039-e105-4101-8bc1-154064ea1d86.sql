
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'assignments','assignment_submissions','fee_records','disciplinary_actions',
    'industrial_training','guest_lectures','ptm_meetings','placements',
    'parent_messages','pdf_documents','classes','app_settings','announcements'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'deny_all_anon_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'deny_all_auth_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE TO anon USING (false) WITH CHECK (false)',
      'deny_all_anon_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false)',
      'deny_all_auth_' || t, t
    );
  END LOOP;
END $$;
