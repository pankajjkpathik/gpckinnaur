CREATE TABLE public.weekly_lesson_plans (
  id BIGSERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester INT NOT NULL,
  week_no INT NOT NULL CHECK (week_no BETWEEN 1 AND 20),
  unit_id INT REFERENCES public.syllabus_units(id) ON DELETE SET NULL,
  unit_no INT,
  topics TEXT NOT NULL DEFAULT '',
  periods INT NOT NULL DEFAULT 0,
  learning_outcomes TEXT DEFAULT '',
  teaching_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, subject_id, academic_year, week_no)
);

CREATE INDEX weekly_lesson_plans_subj_year_idx ON public.weekly_lesson_plans(subject_id, academic_year);
CREATE INDEX weekly_lesson_plans_staff_idx ON public.weekly_lesson_plans(staff_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_lesson_plans TO authenticated;
GRANT ALL ON public.weekly_lesson_plans TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.weekly_lesson_plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.weekly_lesson_plans_id_seq TO service_role;

ALTER TABLE public.weekly_lesson_plans ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (server fns further scope by role); staff/students read via server fns using service role.
CREATE POLICY "authenticated read weekly plans"
  ON public.weekly_lesson_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated write weekly plans"
  ON public.weekly_lesson_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER weekly_lesson_plans_touch
  BEFORE UPDATE ON public.weekly_lesson_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();