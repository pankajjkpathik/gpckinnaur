-- Drop the old constraint that lacks group_label
ALTER TABLE public.faculty_assignments 
DROP CONSTRAINT IF EXISTS faculty_assignments_staff_id_subject_id_branch_semester_aca_key;

-- Add the new unique constraint including group_label
ALTER TABLE public.faculty_assignments
ADD CONSTRAINT faculty_assignments_staff_subject_branch_sem_year_group_key 
UNIQUE (staff_id, subject_id, branch, semester, academic_year, group_label);

-- Ensure all current and future server functions can see the table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_assignments TO authenticated;
GRANT ALL ON public.faculty_assignments TO service_role;