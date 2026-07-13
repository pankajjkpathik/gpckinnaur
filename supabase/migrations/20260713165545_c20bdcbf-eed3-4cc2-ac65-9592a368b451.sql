CREATE TABLE public.student_notification_prefs (
  student_id integer PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  assignments_enabled boolean NOT NULL DEFAULT true,
  fees_enabled boolean NOT NULL DEFAULT true,
  assignments_lead_days integer NOT NULL DEFAULT 7 CHECK (assignments_lead_days BETWEEN 1 AND 30),
  fees_lead_days integer NOT NULL DEFAULT 14 CHECK (fees_lead_days BETWEEN 1 AND 60),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.student_notification_prefs TO service_role;

ALTER TABLE public.student_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_anon_student_notification_prefs"
  ON public.student_notification_prefs AS RESTRICTIVE
  TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_all_auth_student_notification_prefs"
  ON public.student_notification_prefs AS RESTRICTIVE
  TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER trg_student_notification_prefs_updated
  BEFORE UPDATE ON public.student_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();