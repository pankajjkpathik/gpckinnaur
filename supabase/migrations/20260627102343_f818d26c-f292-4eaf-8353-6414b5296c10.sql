
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  m text[][] := ARRAY[
    ['Civil Engineering','civil'],
    ['Mechanical Engineering','mechanical'],
    ['Applied Sciences','applied_science']
  ];
  i int;
  t text;
  tbls text[] := ARRAY['subjects','students','faculty_assignments','timetable','assignments','lesson_plans','study_materials','classes'];
BEGIN
  FOR i IN 1..array_length(m,1) LOOP
    FOREACH t IN ARRAY tbls LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=t AND column_name='branch'
      ) THEN
        EXECUTE format('UPDATE public.%I SET branch=$1 WHERE branch=$2', t)
        USING m[i][2], m[i][1];
      END IF;
    END LOOP;
  END LOOP;
END $$;

INSERT INTO public.staff_users (username, password_hash, role, name, department, is_active)
VALUES ('tpo', crypt('Welcome@123', gen_salt('bf', 12)), 'tpo', 'Training & Placement Officer', 'Administration', true)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, is_active = true;

INSERT INTO public.app_settings (key, value) VALUES ('academic_year','2026-27')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
