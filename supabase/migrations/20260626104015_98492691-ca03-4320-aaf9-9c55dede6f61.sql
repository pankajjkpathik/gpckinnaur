ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS image_url text;