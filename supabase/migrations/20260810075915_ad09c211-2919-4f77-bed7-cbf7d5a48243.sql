ALTER TABLE public.faculty_assignments ADD COLUMN IF NOT EXISTS group_label text;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_assignments TO authenticated;
GRANT ALL ON public.faculty_assignments TO service_role;