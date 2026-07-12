## Goal

Track **theory (lecture) hours** and **practical hours** as two independent quantities per unit, with independent validation:

- Σ theory hours across units = **L × 14**
- Σ practical hours across units = **P × 14**

No more combined L+P total. A subject with 3L + 2P must have 42 lecture-hours **and** 28 practical-hours planned separately.

## Changes

### 1. Database (migration)

Add two columns to `public.syllabus_units`:

- `lecture_hours integer NOT NULL DEFAULT 0`
- `practical_hours integer NOT NULL DEFAULT 0`

Backfill existing rows: copy `hours` into `lecture_hours` for theory-only subjects (P=0), into `practical_hours` for lab-only subjects (L=0), and split proportionally for mixed subjects. Keep the old `hours` column as a generated/legacy total for now so nothing else breaks.

### 2. Server functions (`src/lib/academic.functions.ts`)

- `upsertSyllabusUnit` — accept `lecture_hours` and `practical_hours` (both required, ≥0); derive `hours = lecture_hours + practical_hours` on write.
- `syllabusUnitReconciliation` — return both `lecture_hours_sum` / `practical_hours_sum` and separate diffs vs `L×14` and `P×14`; a subject is "mismatch" if either side is off.
- Coverage functions that read `hours` keep working (still populated), but a follow-up can switch them to the split fields.

### 3. Admin UI (`src/routes/admin.syllabus-units.tsx`)

- **Unit table**: replace the single "Hours" column with two columns — "Theory hrs" and "Practical hrs" — plus a small combined subtotal.
- **Header summary**: show two required totals and two live totals:
  `Theory 40 / 42 required · Practical 28 / 28 required ✓`.
- **Validation banner**: green only when both match; otherwise show which side is off and by how much.
- **Add/Edit unit modal**: two number inputs (Theory / Practical), each with its own remaining-hours helper. Disable the theory input if `L=0`, practical input if `P=0`.
- **Reconciliation panel**: two diff columns (Theory Δ, Practical Δ), status "Mismatch" if either side is off.

### 4. Markdown / JSON import (`MdImportModal` + `parse-syllabus-md.ts`)

- Extend parser to recognise `(10 hours theory)`, `(4 hours practical)`, `Theory: 8`, `Practical: 4`. Unlabelled hours fall into theory (backward compatible).
- Preview table shows theory + practical columns with −/+ controls per side.
- `Auto-distribute` runs `rescaleHours` twice — once for the theory total (target `L×14`), once for practical (target `P×14`).
- JSON export/import schema bumps to `syllabus-units.v2` with `lecture_hours` / `practical_hours` per unit. v1 files still import (values go into `lecture_hours`).

### 5. Weekly plan generator

`generateWeeklyPlan` currently sums lecture+practical per week. Keep behaviour but derive `periods_per_week` from `subject.lecture_hours + subject.practical_hours` as today — no functional change needed this turn; the split just makes future L/P-separate scheduling possible.

## Out of scope

- Splitting weekly lesson plans into separate theory/practical rows.
- Re-computing historical coverage percentages with the new split.

## Approval

This touches the DB schema and every place that reads unit hours. Approving this plan will trigger the migration first, then the code edits after the types file regenerates.
