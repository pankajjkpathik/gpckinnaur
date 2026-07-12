
ALTER TABLE public.syllabus_units
  ADD COLUMN IF NOT EXISTS lecture_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_hours integer NOT NULL DEFAULT 0;

-- Backfill from existing `hours` using the parent subject's L/P ratio.
WITH s AS (
  SELECT id, COALESCE(lecture_hours,0) AS lh, COALESCE(practical_hours,0) AS ph
  FROM public.subjects
)
UPDATE public.syllabus_units u
SET
  lecture_hours = CASE
    WHEN s.ph = 0 THEN COALESCE(u.hours,0)
    WHEN s.lh = 0 THEN 0
    ELSE ROUND(COALESCE(u.hours,0)::numeric * s.lh / NULLIF(s.lh + s.ph,0))::int
  END,
  practical_hours = CASE
    WHEN s.lh = 0 THEN COALESCE(u.hours,0)
    WHEN s.ph = 0 THEN 0
    ELSE COALESCE(u.hours,0)
         - ROUND(COALESCE(u.hours,0)::numeric * s.lh / NULLIF(s.lh + s.ph,0))::int
  END
FROM s
WHERE u.subject_id = s.id
  AND (u.lecture_hours = 0 AND u.practical_hours = 0);

-- Keep `hours` in sync as the derived total, so legacy readers keep working.
CREATE OR REPLACE FUNCTION public.syllabus_units_sync_hours()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.hours := COALESCE(NEW.lecture_hours,0) + COALESCE(NEW.practical_hours,0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_syllabus_units_sync_hours ON public.syllabus_units;
CREATE TRIGGER trg_syllabus_units_sync_hours
BEFORE INSERT OR UPDATE ON public.syllabus_units
FOR EACH ROW EXECUTE FUNCTION public.syllabus_units_sync_hours();
