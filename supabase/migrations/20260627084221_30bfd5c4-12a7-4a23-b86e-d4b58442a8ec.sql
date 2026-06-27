ALTER TABLE public.staff_users
  ADD COLUMN IF NOT EXISTS extra_roles TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.staff_users
SET extra_roles = ARRAY['faculty']
WHERE role = 'hod'
  AND NOT ('faculty' = ANY(extra_roles));

CREATE TABLE IF NOT EXISTS public.app_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value)
VALUES ('academic_year', '2026-27')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();