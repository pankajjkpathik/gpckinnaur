-- TPO tables: placements, industrial_training, guest_lectures
CREATE TABLE IF NOT EXISTS public.placements (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
  student_name VARCHAR(150) NOT NULL,
  roll_number VARCHAR(40),
  branch VARCHAR(50),
  company VARCHAR(200) NOT NULL,
  package_lpa NUMERIC(6,2),
  year INTEGER NOT NULL,
  created_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_placements_year ON public.placements (year);
CREATE INDEX IF NOT EXISTS idx_placements_branch ON public.placements (branch);

CREATE TABLE IF NOT EXISTS public.industrial_training (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  training_type VARCHAR(100) NOT NULL,
  branch VARCHAR(50),
  semester INTEGER,
  student_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  company VARCHAR(200),
  start_date DATE,
  end_date DATE,
  created_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.industrial_training TO service_role;
ALTER TABLE public.industrial_training ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_training_branch ON public.industrial_training (branch);

CREATE TABLE IF NOT EXISTS public.guest_lectures (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic VARCHAR(300) NOT NULL,
  speaker VARCHAR(200) NOT NULL,
  lecture_date DATE,
  department VARCHAR(100),
  detail TEXT,
  created_by INTEGER REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.guest_lectures TO service_role;
ALTER TABLE public.guest_lectures ENABLE ROW LEVEL SECURITY;