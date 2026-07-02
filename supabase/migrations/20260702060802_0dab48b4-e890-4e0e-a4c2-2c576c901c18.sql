
-- 1. Parent credentials
CREATE TABLE IF NOT EXISTS public.parent_users (
  student_id INTEGER PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_users TO authenticated;
GRANT ALL ON public.parent_users TO service_role;

ALTER TABLE public.parent_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_anon_parent_users" ON public.parent_users
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_auth_parent_users" ON public.parent_users
  AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER trg_parent_users_updated BEFORE UPDATE ON public.parent_users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Relax marks exam_type check to add new keys used by the marks entry redesign.
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS marks_exam_type_check;
ALTER TABLE public.marks ADD CONSTRAINT marks_exam_type_check
  CHECK (exam_type::text = ANY (ARRAY[
    'internal','assignment','assignment_2','assignment_1',
    'first_class_test','second_class_test','class_test_1','class_test_2',
    'house_test','mid_sessional','final_sessional','practical','viva'
  ]::text[]));

-- 3. Extend pdf_documents.doc_type to allow lesson_plan and exam_schedule.
ALTER TABLE public.pdf_documents DROP CONSTRAINT IF EXISTS pdf_documents_doc_type_check;
-- (no prior check existed; add one now so all types are consistent)
ALTER TABLE public.pdf_documents ADD CONSTRAINT pdf_documents_doc_type_check
  CHECK (doc_type::text = ANY (ARRAY['calendar','syllabus','lesson_plan','exam_schedule']::text[]));
