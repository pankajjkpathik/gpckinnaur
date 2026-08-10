-- Add group_label to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS group_label text;

-- Update RLS grants to ensure visibility (if needed)
GRANT SELECT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
