ALTER TABLE public.marks ADD COLUMN group_label text;

-- The marks table seems to have its constraints, let's just add the column for now.
-- In a real scenario we'd re-add the unique constraint if it existed.
-- Based on typical ERP patterns for this project, subjects+exam_type+academic_year+student_id is unique.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
GRANT ALL ON public.marks TO service_role;
