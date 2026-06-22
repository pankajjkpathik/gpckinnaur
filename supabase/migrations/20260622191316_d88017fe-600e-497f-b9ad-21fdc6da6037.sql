
CREATE TABLE public.staff_salary (
  id bigserial PRIMARY KEY,
  staff_id bigint NOT NULL REFERENCES public.staff_users(id) ON DELETE CASCADE,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  basic numeric(12,2) NOT NULL DEFAULT 0,
  da numeric(12,2) NOT NULL DEFAULT 0,
  hra numeric(12,2) NOT NULL DEFAULT 0,
  other_allow numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) GENERATED ALWAYS AS (basic + da + hra + other_allow - deductions) STORED,
  remarks text,
  paid_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, month, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_salary TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.staff_salary_id_seq TO authenticated;
GRANT ALL ON public.staff_salary TO service_role;
GRANT ALL ON SEQUENCE public.staff_salary_id_seq TO service_role;

ALTER TABLE public.staff_salary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny anon salary" ON public.staff_salary FOR SELECT TO anon USING (false);
CREATE POLICY "deny anon salary write" ON public.staff_salary FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE TRIGGER trg_staff_salary_touch BEFORE UPDATE ON public.staff_salary
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.report_templates (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('monthly_attendance','mid_sessional','final_sessional','external_practical','other')),
  file_name text NOT NULL,
  file_b64 text NOT NULL,
  uploaded_by bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_templates TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.report_templates_id_seq TO authenticated;
GRANT ALL ON public.report_templates TO service_role;
GRANT ALL ON SEQUENCE public.report_templates_id_seq TO service_role;

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny anon templates" ON public.report_templates FOR SELECT TO anon USING (false);
CREATE POLICY "deny anon templates write" ON public.report_templates FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE TRIGGER trg_report_templates_touch BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
