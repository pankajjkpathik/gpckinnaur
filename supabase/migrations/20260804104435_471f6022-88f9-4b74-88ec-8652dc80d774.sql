ALTER TABLE public.faculty_assignments
  ADD COLUMN IF NOT EXISTS guest_faculty text,
  ADD COLUMN IF NOT EXISTS guest_institute text;

ALTER TABLE public.faculty_assignments ALTER COLUMN staff_id DROP NOT NULL;

ALTER TABLE public.faculty_assignments
  DROP CONSTRAINT IF EXISTS faculty_assignments_staff_or_guest_chk;
ALTER TABLE public.faculty_assignments
  ADD CONSTRAINT faculty_assignments_staff_or_guest_chk
  CHECK (staff_id IS NOT NULL OR (guest_faculty IS NOT NULL AND length(btrim(guest_faculty)) > 0));

CREATE UNIQUE INDEX IF NOT EXISTS faculty_assignments_guest_uniq
  ON public.faculty_assignments (subject_id, branch, semester, academic_year, lower(btrim(guest_faculty)))
  WHERE staff_id IS NULL;