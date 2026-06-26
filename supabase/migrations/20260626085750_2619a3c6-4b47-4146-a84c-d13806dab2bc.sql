
CREATE TABLE IF NOT EXISTS public.assignments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  branch VARCHAR(50) NOT NULL,
  semester INTEGER NOT NULL,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name VARCHAR(150),
  due_date DATE,
  file_url VARCHAR(500),
  created_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  academic_year VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments (branch, semester);
CREATE INDEX IF NOT EXISTS idx_assignments_creator ON public.assignments (created_by);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  comments TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  grade VARCHAR(20),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  graded_at TIMESTAMPTZ,
  graded_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  UNIQUE (assignment_id, student_id)
);
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions (student_id);

CREATE TABLE IF NOT EXISTS public.fee_records (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year VARCHAR(10),
  semester INTEGER,
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'due',
  due_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.fee_records TO service_role;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON public.fee_records (student_id);

CREATE TABLE IF NOT EXISTS public.disciplinary_actions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  detail TEXT,
  action_date DATE DEFAULT now(),
  severity VARCHAR(20) NOT NULL DEFAULT 'notice',
  issued_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  resolution_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.disciplinary_actions TO service_role;
ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disciplinary_student ON public.disciplinary_actions (student_id);
