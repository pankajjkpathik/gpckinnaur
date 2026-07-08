
DROP INDEX IF EXISTS public.timetable_unique_slot_grp;

UPDATE public.timetable SET group_label = '' WHERE group_label IS NULL;
ALTER TABLE public.timetable
  ALTER COLUMN group_label SET DEFAULT '',
  ALTER COLUMN group_label SET NOT NULL;

ALTER TABLE public.timetable
  ADD CONSTRAINT timetable_unique_slot_grp
  UNIQUE (branch, semester, day_of_week, period_no, academic_year, group_label);
