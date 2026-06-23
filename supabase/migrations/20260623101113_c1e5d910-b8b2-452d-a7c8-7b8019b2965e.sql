
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_category') THEN
    CREATE TYPE public.subject_category AS ENUM ('BS','HS','ES','PCC','PE','OE','AU','Project');
  END IF;
END $$;

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS category public.subject_category,
  ADD COLUMN IF NOT EXISTS lecture_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dcs_bs_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_weekly_load integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_theory_marks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_practical_marks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_theory_marks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_practical_marks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_marks integer NOT NULL DEFAULT 0;
