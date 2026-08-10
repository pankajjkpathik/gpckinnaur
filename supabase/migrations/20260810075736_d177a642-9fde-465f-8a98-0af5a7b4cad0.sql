ALTER TABLE public.students ADD COLUMN IF NOT EXISTS group_label text;
GRANT SELECT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;