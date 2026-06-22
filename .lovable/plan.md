## Plan — College ERP (Staff + Student Portals)

"Do everything" is honestly weeks of work — six portals, ~30 modules, deep cross-dependencies. To ship something that actually works instead of 30 broken screens, I'll build it in phases. Each phase is independently usable. You approve this overall plan; I then execute phase by phase and check in after each.

### Decisions locked in from your answers
- Custom auth stays. Add `clerk` to staff roles. No Google/Lovable Cloud auth migration.
- One class = (Branch + Semester). No sections.
- Reports: on-screen + PDF + Excel download.
- Six roles: `super_admin`, `principal`, `hod`, `faculty`, `clerk`, `admin_staff` (existing `admin_staff` keeps system-config powers).

---

### Phase 1 — Data foundation (DB + Admin Setup)
The whole system collapses without this. Nothing else starts until Phase 1 is in.

**New tables** (with GRANTs + RLS via service_role since custom auth bypasses RLS):
- `subjects` (code, name, branch, semester, theory/practical, credits)
- `periods_master` (period_no, start_time, end_time, duration)
- `timetable` (branch, semester, day_of_week, period_no, subject_id, faculty_id, room)
- `syllabus_units` (subject_id, unit_no, title, topics jsonb, hours)
- `academic_calendar` (year, sem_start, sem_end, exam_dates jsonb, holidays jsonb, events jsonb, published)
- `grading_scheme` (min/max marks → grade, pass_marks)
- `attendance` (student_id, subject_id, date, period_no, status, marked_by, marked_at, locked)
- `marks` (student_id, subject_id, exam_type [internal/mid/final/practical], max, obtained, entered_by, submitted_to_hod, locked, returned_remarks)
- `lesson_plans` (faculty_id, subject_id, branch, semester, unit_id, planned_date, actual_date, status [draft/submitted/approved/returned], remarks, coverage_pct)
- `leave_applications` (applicant_id, applicant_type, leave_type, from_date, to_date, reason, status, approved_by, comp_off_earned)
- `circulars` (title, body, audience, published_by, published_at)
- Add `clerk` to staff_users role enum
- Add `assigned_class` table for faculty↔subject↔(branch,sem) mapping
- Add `mobile_no`, `address` to students (for student-profile editing)

**Admin screens** (`/admin/*`):
- Master Data: subjects, periods, grading scheme
- Time Table Builder (class-wise grid, double-booking detection, faculty view auto-generated, publish toggle)
- Syllabus upload (unit + topic breakdown per subject)
- Academic Calendar editor + publish
- User Management (already partly built — extend with audit log + role assignment)

**Clerk portal** (`/clerk/*`):
- Student master CRUD + CSV bulk import + class assignment + TC processing
- Staff master CRUD + document upload (uses Supabase Storage bucket)
- Search/export to Excel + PDF

End of Phase 1: all reference data exists, can be loaded.

---

### Phase 2 — Faculty portal (the data-entry engine)
- Dashboard: today's schedule from timetable, "mark attendance for next period" CTA, pending tasks, leave balance
- Attendance Mgmt: period-wise marking UI with student list; same-day edit; class-summary view; defaulter highlight
- Marks Entry: 4 tabs (internal / mid / final / practical), preview → submit-to-HOD → locked
- Lesson Plans: create against syllabus units, coverage % auto-computed, status with HOD
- Leave: apply, status tracker, history, comp-off balance
- Reports: Monthly Attendance, Mid-Sessional, Final-Sessional — auto-compiled, on-screen + PDF (jsPDF/pdfmake) + Excel (xlsx)

End of Phase 2: faculty can run their entire workflow.

---

### Phase 3 — HOD portal (monitoring + approvals)
- Dashboard: dept strength, today's attendance, pending leaves, upcoming events
- Attendance Monitoring: class-wise grid, defaulter list, faculty submission tracker
- Marks/Progress: class-wise + subject-wise + cross-semester comparison
- Lesson Plan Review: approve / return with remarks; coverage tracker
- Leave Approvals: approve/reject + dept leave calendar + substitution note
- Reports: dept-rolled-up Monthly/Mid/Final + faculty performance summary

End of Phase 3: department head fully operational.

---

### Phase 4 — Principal portal
- Dashboard: institute totals, dept-wise attendance snapshot, pending approvals
- Attendance Overview: dept summaries, institute defaulter report, monthly trend graph (Recharts)
- Academic Monitoring: dept results, lesson plan compliance, syllabus coverage, calendar alignment
- Staff Management View: dept staff lists, leave records, final-level leave approval
- Reports: institute-level rollups + annual summary
- Notices & Communication: issue circulars, broadcast, view academic calendar

---

### Phase 5 — Student portal
(Most foundational pieces already exist — just need wiring once data sources are real)
- Dashboard: overall attendance %, recent marks, exam alerts, latest notice
- Attendance: subject-wise %, date-wise, monthly summary, below-threshold warning
- Marks/Results: internal/mid/final/grade cards across semesters
- Academics: timetable, syllabus, lesson plan coverage (read-only), calendar
- Leave & Communication: apply leave, status, read circulars, download admit cards
- Profile: view, edit contact/address, change password

---

### Phase 6 — Polish & hardening
- Audit log viewer for Admin
- Excel/PDF report templates standardized
- SEO/meta on public pages, `noindex` on all portal routes
- Empty-states, loading skeletons, error boundaries
- Smoke tests on each role flow

---

### Technical notes
- All server logic via `createServerFn` in `src/lib/*.functions.ts`. `supabaseAdmin` (service role) inside handlers since custom session auth is in use.
- Role gating via existing `staff_session` cookie; add a `requireRole(roles[])` helper in `src/lib/auth.functions.ts`.
- PDF: `@react-pdf/renderer` or `pdfmake`. Excel: `xlsx` (SheetJS). Both client-side from already-fetched data — no server PDF rendering needed.
- Routes:
  - `/staff-dashboard` becomes role-aware router that redirects to `/faculty/*`, `/hod/*`, `/principal/*`, `/clerk/*`, `/admin/*` based on role
  - All portal routes get `noindex,nofollow` and are excluded from sitemap (already the pattern)
- Charts: Recharts (already in deps via shadcn).
- File uploads (staff/student docs, syllabus PDFs): Supabase Storage bucket `documents` with size limit + signed URLs.

---

### What I need from you to start
1. **Approve this overall plan** — I won't start Phase 1 without it.
2. **Confirm Phase 1 first** — I'll begin with the migration (one big SQL migration, you approve it), then build the Admin + Clerk UI on top.
3. Anything you want to drop from scope? (e.g. skip comp-off, skip CSV import, skip room conflict detection.)

Reply "go" and I start with the Phase 1 migration.