ALTER TABLE public.sessional_marks ADD COLUMN group_label text;

-- Update unique constraint to include group_label
-- First, find the existing unique constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.sessional_marks'::regclass AND contype = 'u';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.sessional_marks DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.sessional_marks ADD CONSTRAINT sessional_marks_unique_entry 
UNIQUE (student_id, subject_id, exam_type, academic_year, group_label);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessional_marks TO authenticated;
GRANT ALL ON public.sessional_marks TO service_role;
