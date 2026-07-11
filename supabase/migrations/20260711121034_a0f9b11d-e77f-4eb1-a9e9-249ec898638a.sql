
ALTER TABLE public.syllabus_units
  ADD COLUMN academic_year TEXT NOT NULL DEFAULT '2025-26',
  ADD COLUMN semester INT NULL;

ALTER TABLE public.syllabus_units ALTER COLUMN academic_year DROP DEFAULT;

ALTER TABLE public.syllabus_units
  ADD CONSTRAINT syllabus_units_academic_year_format_chk
  CHECK (academic_year ~ '^\d{4}-\d{2}$');

ALTER TABLE public.syllabus_units
  ADD CONSTRAINT syllabus_units_semester_range_chk
  CHECK (semester IS NULL OR (semester BETWEEN 1 AND 8));

ALTER TABLE public.syllabus_units
  DROP CONSTRAINT IF EXISTS syllabus_units_subject_id_unit_no_key;

ALTER TABLE public.syllabus_units
  ADD CONSTRAINT syllabus_units_subject_year_unit_key
  UNIQUE (subject_id, academic_year, unit_no);

CREATE INDEX IF NOT EXISTS syllabus_units_academic_year_idx
  ON public.syllabus_units (academic_year);
