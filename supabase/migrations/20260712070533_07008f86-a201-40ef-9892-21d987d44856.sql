-- Replace auto_provision_parent_user so it never seeds a shared default password.
-- Row is created inactive with a random unusable hash; student must set a real
-- password via studentSetParentPassword before parent can sign in.
CREATE OR REPLACE FUNCTION public.auto_provision_parent_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.parent_users (student_id, password_hash, is_active, updated_at)
  VALUES (
    NEW.id,
    crypt(encode(gen_random_bytes(24), 'hex'), gen_salt('bf', 12)),
    false,
    now()
  )
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Deactivate any existing parent rows that still carry the old shared password.
UPDATE public.parent_users
SET is_active = false,
    password_hash = crypt(encode(gen_random_bytes(24), 'hex'), gen_salt('bf', 12)),
    updated_at = now()
WHERE password_hash = crypt('Welcome@123', password_hash);