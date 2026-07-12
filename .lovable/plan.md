## Student Portal Rework

Four changes to `src/routes/student-dashboard.tsx` (+ one small server-function addition).

### 1. Two-panel layout (LHS options / RHS output)

Replace the current "cards grid → back button" flow with a persistent sidebar.

```text
┌─ Header (logo · profile · logout) ────────────────────────────┐
├──────────────┬────────────────────────────────────────────────┤
│ Sidebar      │ Active view                                    │
│ (sticky)     │                                                │
│ • Home       │   My Attendance  /  My Marks  /  Timetable…   │
│ • Attendance │                                                │
│ • Marks      │   (content changes when a sidebar item is      │
│ • Results    │    clicked, URL unchanged)                     │
│ • Lesson     │                                                │
│   Plans      │                                                │
│ • Syllabus…  │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

- Sidebar shows every card that used to live on the "home" grid, in the same order, with the same icon + color accent.
- Active item highlighted; collapse toggle for narrow screens (hamburger on mobile).
- Remove the `BackBtn` from each view — sidebar is always visible.
- Home view becomes a summary dashboard (welcome + today's periods + attendance stat) rather than a card grid.

### 2. Lesson Plans not showing


`LessonPlanLibrary` reads `pdf_documents` where `doc_type = 'lesson_plan'` via `pdfDocListShared`. Fix by:
- Passing `defaultBranch={me.branch}` and `defaultSemester={me.semester}` so the list is pre-scoped to the student's class instead of the "All branches / All semesters" default (which sometimes returns 0 rows if uploads exist but the shared endpoint hits an OR-filter edge case).
- Hiding the branch/semester filter dropdowns for students (they only need their own class).
- If nothing exists for the student's class, still show the empty-state row (unchanged).

### 4. Syllabus Coverage — only student's own subjects

`coverageSummary` already forces student scope server-side, but the UI still shows the `filters` selectors (empty). Fix:
- Pass explicit `scope={{ branch: me.branch, semester: me.semester }}` and no `filters` prop so the UI table hides the filter row entirely.
- Below the coverage table, keep the "Syllabus units" list from `studentSyllabus` (already class-scoped).

### 5. Timetable → same visual as HOD/Principal

Replace the ad-hoc table in `TimetableView` with the shared `<TimetableGrid>` component (read-only):
- Fetch periods via `listPeriods()` (already exposed).
- Feed the existing `studentTimetable` output as `slots` — the shape (`day_of_week, period_no, subject_id, staff_id, subjects{code,name}, staff_users{username}`) already matches `TTSlot`; add missing optional fields with a small mapper.
- Pass `institutionLine="Govt. Polytechnic Kinnaur…"` and `classLine="${branchLabel} — ${ord(sem)} Semester"` for parity with HOD.
- `editable={false}`; no `onSaveSlot`.

### Files touched

- `src/routes/student-dashboard.tsx` — sidebar shell, 5 view rewrites.
- `src/lib/student.functions.ts` — add `studentSessionalReport` (mid + final) delegating to the same aggregation used by HOD.
- No schema changes, no other routes touched.
