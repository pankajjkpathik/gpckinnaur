CREATE OR REPLACE FUNCTION public.auto_provision_parent_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.parent_users (student_id, password_hash, is_active, updated_at)
  VALUES (
    NEW.id,
    extensions.crypt('Welcome@123', extensions.gen_salt('bf', 12)),
    true,
    now()
  )
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$;