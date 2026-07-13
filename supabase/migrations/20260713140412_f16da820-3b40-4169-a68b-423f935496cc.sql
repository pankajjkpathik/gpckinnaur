ALTER TABLE public.marks
  ADD COLUMN IF NOT EXISTS reviewed_by integer REFERENCES public.staff_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;