ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_gender_check;
ALTER TABLE public.students
  ADD CONSTRAINT students_gender_check
  CHECK (gender IS NULL OR gender IN ('Male','Female','Other'));

ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_category_check;
ALTER TABLE public.students
  ADD CONSTRAINT students_category_check
  CHECK (category IS NULL OR category IN ('General','SC','ST','OBC','TFW','EWS','Girl Child','Others'));