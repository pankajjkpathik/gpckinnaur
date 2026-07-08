
ALTER TABLE public.timetable
  ADD COLUMN IF NOT EXISTS group_label text,
  ADD COLUMN IF NOT EXISTS span_periods integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS co_staff_ids integer[] NOT NULL DEFAULT '{}';

ALTER TABLE public.timetable
  DROP CONSTRAINT IF EXISTS timetable_branch_semester_day_of_week_period_no_academic_ye_key;

CREATE UNIQUE INDEX IF NOT EXISTS timetable_unique_slot_grp
  ON public.timetable (branch, semester, day_of_week, period_no, academic_year, COALESCE(group_label, ''));
