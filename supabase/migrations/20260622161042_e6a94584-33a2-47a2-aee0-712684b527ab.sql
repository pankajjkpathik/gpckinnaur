
-- ============ extend existing tables ============
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS guardian_phone varchar(20),
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS admission_date date;

-- staff_users.role is varchar, so 'clerk' just works in app code; nothing to change.

-- ============ helper: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ master data ============
CREATE TABLE public.subjects (
  id bigserial PRIMARY KEY,
  code varchar(20) NOT NULL,
  name varchar(150) NOT NULL,
  branch varchar(50) NOT NULL,
  semester int NOT NULL CHECK (semester BETWEEN 1 AND 8),
  kind varchar(10) NOT NULL DEFAULT 'theory' CHECK (kind IN ('theory','practical')),
  credits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, branch, semester)
);
GRANT ALL ON public.subjects TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.subjects_id_seq TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.subjects AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.subjects AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.periods_master (
  id bigserial PRIMARY KEY,
  period_no int NOT NULL UNIQUE CHECK (period_no BETWEEN 1 AND 12),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_break boolean NOT NULL DEFAULT false,
  label varchar(30)
);
GRANT ALL ON public.periods_master TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.periods_master_id_seq TO service_role;
ALTER TABLE public.periods_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.periods_master AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.periods_master AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.grading_scheme (
  id bigserial PRIMARY KEY,
  min_pct numeric(5,2) NOT NULL,
  max_pct numeric(5,2) NOT NULL,
  grade varchar(5) NOT NULL,
  grade_point numeric(4,2) NOT NULL DEFAULT 0,
  is_pass boolean NOT NULL DEFAULT true
);
GRANT ALL ON public.grading_scheme TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.grading_scheme_id_seq TO service_role;
ALTER TABLE public.grading_scheme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.grading_scheme AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.grading_scheme AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);

-- ============ timetable + faculty assignment ============
CREATE TABLE public.faculty_assignments (
  id bigserial PRIMARY KEY,
  staff_id int NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  branch varchar(50) NOT NULL,
  semester int NOT NULL,
  academic_year varchar(9) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, subject_id, branch, semester, academic_year)
);
GRANT ALL ON public.faculty_assignments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.faculty_assignments_id_seq TO service_role;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.faculty_assignments AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.faculty_assignments AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.timetable (
  id bigserial PRIMARY KEY,
  branch varchar(50) NOT NULL,
  semester int NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  period_no int NOT NULL,
  subject_id bigint REFERENCES public.subjects(id) ON DELETE SET NULL,
  staff_id int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  room varchar(30),
  academic_year varchar(9) NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch, semester, day_of_week, period_no, academic_year)
);
GRANT ALL ON public.timetable TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.timetable_id_seq TO service_role;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.timetable AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.timetable AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_timetable_updated BEFORE UPDATE ON public.timetable FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_timetable_staff_day ON public.timetable(staff_id, day_of_week);

-- ============ syllabus ============
CREATE TABLE public.syllabus_units (
  id bigserial PRIMARY KEY,
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_no int NOT NULL,
  title varchar(200) NOT NULL,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  hours int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, unit_no)
);
GRANT ALL ON public.syllabus_units TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.syllabus_units_id_seq TO service_role;
ALTER TABLE public.syllabus_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.syllabus_units AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.syllabus_units AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_syllabus_updated BEFORE UPDATE ON public.syllabus_units FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ academic calendar ============
CREATE TABLE public.academic_calendar (
  id bigserial PRIMARY KEY,
  academic_year varchar(9) NOT NULL UNIQUE,
  semester_label varchar(20) NOT NULL,
  sem_start date NOT NULL,
  sem_end date NOT NULL,
  exam_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  holidays jsonb NOT NULL DEFAULT '[]'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.academic_calendar TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.academic_calendar_id_seq TO service_role;
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.academic_calendar AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.academic_calendar AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_calendar_updated BEFORE UPDATE ON public.academic_calendar FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ attendance ============
CREATE TABLE public.attendance (
  id bigserial PRIMARY KEY,
  student_id int NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date date NOT NULL,
  period_no int NOT NULL,
  status varchar(10) NOT NULL CHECK (status IN ('present','absent','leave','late')),
  marked_by int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  marked_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false,
  UNIQUE (student_id, subject_id, date, period_no)
);
GRANT ALL ON public.attendance TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.attendance_id_seq TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.attendance AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.attendance AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_attendance_student_subject ON public.attendance(student_id, subject_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);

-- ============ marks ============
CREATE TABLE public.marks (
  id bigserial PRIMARY KEY,
  student_id int NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_type varchar(20) NOT NULL CHECK (exam_type IN ('internal','assignment','mid_sessional','final_sessional','practical','viva')),
  max_marks numeric(6,2) NOT NULL,
  obtained numeric(6,2),
  remarks text,
  entered_by int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  submitted_to_hod boolean NOT NULL DEFAULT false,
  approved_by_hod boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  returned_remarks text,
  academic_year varchar(9) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, exam_type, academic_year)
);
GRANT ALL ON public.marks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.marks_id_seq TO service_role;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.marks AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.marks AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_marks_updated BEFORE UPDATE ON public.marks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ lesson plans ============
CREATE TABLE public.lesson_plans (
  id bigserial PRIMARY KEY,
  staff_id int NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  branch varchar(50) NOT NULL,
  semester int NOT NULL,
  unit_id bigint REFERENCES public.syllabus_units(id) ON DELETE SET NULL,
  topic varchar(300) NOT NULL,
  planned_date date,
  actual_date date,
  status varchar(15) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','returned')),
  hod_remarks text,
  academic_year varchar(9) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lesson_plans TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.lesson_plans_id_seq TO service_role;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.lesson_plans AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.lesson_plans AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_lp_updated BEFORE UPDATE ON public.lesson_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ leave applications ============
CREATE TABLE public.leave_applications (
  id bigserial PRIMARY KEY,
  applicant_type varchar(10) NOT NULL CHECK (applicant_type IN ('staff','student')),
  applicant_id int NOT NULL,
  leave_type varchar(20) NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  status varchar(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approver_id int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  approver_remarks text,
  comp_off boolean NOT NULL DEFAULT false,
  substitute_staff_id int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT ALL ON public.leave_applications TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.leave_applications_id_seq TO service_role;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.leave_applications AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.leave_applications AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_leave_applicant ON public.leave_applications(applicant_type, applicant_id);

-- ============ circulars / communication ============
CREATE TABLE public.circulars (
  id bigserial PRIMARY KEY,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  audience varchar(20) NOT NULL DEFAULT 'all' CHECK (audience IN ('all','staff','students','faculty','hods')),
  attachment_url text,
  published_by int REFERENCES public.staff_users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.circulars TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.circulars_id_seq TO service_role;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.circulars AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.circulars AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);

-- ============ audit log ============
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  actor_type varchar(10) NOT NULL,
  actor_id int,
  action varchar(80) NOT NULL,
  entity varchar(60),
  entity_id text,
  details jsonb,
  ip varchar(45),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.audit_log AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_authenticated" ON public.audit_log AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);
