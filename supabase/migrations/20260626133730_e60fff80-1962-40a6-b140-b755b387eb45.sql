ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS designation VARCHAR(120);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS ip_number VARCHAR(50);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS pmis_number VARCHAR(50);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS last_salary_drawn NUMERIC(12,2);
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS date_of_retirement DATE;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(40);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150);