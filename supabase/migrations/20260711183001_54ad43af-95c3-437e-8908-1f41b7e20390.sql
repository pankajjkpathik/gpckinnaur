
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backfill: every active student gets a parent_users row with default password Welcome@123
INSERT INTO public.parent_users (student_id, password_hash, is_active, updated_at)
SELECT s.id, crypt('Welcome@123', gen_salt('bf', 12)), true, now()
FROM public.students s
WHERE s.is_active = true
ON CONFLICT (student_id) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      is_active = true,
      updated_at = now()
  WHERE public.parent_users.password_hash IS NULL
     OR public.parent_users.is_active = false;

-- Auto-provision on new student insert
CREATE OR REPLACE FUNCTION public.auto_provision_parent_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.parent_users (student_id, password_hash, is_active, updated_at)
  VALUES (NEW.id, crypt('Welcome@123', gen_salt('bf', 12)), true, now())
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_provision_parent_user ON public.students;
CREATE TRIGGER trg_auto_provision_parent_user
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.auto_provision_parent_user();
