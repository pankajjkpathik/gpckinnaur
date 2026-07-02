## 1. Parent Portal (under Student Portal)
- New migration: `parent_users(student_id PK/FK, password_hash, created_at, last_login)`. Login = student IR (Enrollment No.); password set by the student.
- Student portal: add "Parent Access" page → set/reset parent password.
- New routes: `/parent-login`, `/parent-dashboard` with tabs: **Attendance**, **Marks**, **Board Marks**, **Disciplinary Actions**, **Fees Payment** (read-only views of existing student data).
- Session cookie `parent_session` (mirrors staff/student session pattern).

## 2. Bulk-upload sample for students
- Add a downloadable `students-sample.xlsx` template button on `admin.students.tsx` (and clerk bulk-upload) with columns: enrollment_no, name, father_name, mother_name, dob, gender, category, branch, semester, batch_year, phone, email, address, admission_date.

## 3. Faculty "Generate Reports" — 6 official reports
Add under `staff-reports.tsx` (or new `/staff-reports/*` sub-routes). Each generates a print-ready HTML page (browser print → PDF), auto-populated from attendance/marks tables:

| Report | Source | Format |
|---|---|---|
| Individual Subject Register | attendance filtered by class+subject, daily grid | Roll × Date table |
| Cumulative Consolidated Register | attendance grouped by student × subject | Class matrix |
| Subject Sessional Report (S-1) | marks (CT1, CT2, Assignment, Attendance) for one subject | S-1 proforma from `s1s2.pdf` |
| End-Semester Sessional Report (S-2) | marks across all subjects | S-2 consolidated proforma |
| Monthly Attendance Register | attendance for month, all subjects | Theory%, Practical%, Overall% (no fine) |
| Final Attendance Report | attendance + house test + athletics/cultural weightage + fine (₹5/period absent) | Matches `sem4.pdf` layout |

Selectors: branch, semester, month/session; "Print" button on each.

## 4. Marks entry restructure (`faculty.tsx` marks section)
- Primary selector = **Subject name** (not exam type).
- Table columns: Roll No. · Name · Class Test 1 · Class Test 2 · House Test · Assignment 1 · Assignment 2.
- One row per student with all 5 exam-type inputs inline; saves to `marks` table with existing `exam_type` enum extended.

## 5. Lesson Plans — PDF (not syllabus coverage)
- Replace syllabus-coverage UI in Manage Lesson Plans with PDF upload + list (reuse `PdfDocsPage` with `docType='lesson_plan'`). Faculty upload PDF per subject; students/HOD/Principal can view/download.

## 6. Fix Exam Schedule upload
- `admin.calendar.tsx` (or wherever `docType='exam_schedule'` lives): the "Upload Schedule" button currently no-ops. Wire it to `pdfDocuments.upload` server fn; refresh list on success.

## 7. Student portal cleanup
- "Upload Assignment" tab: fetch **pending** assignments (assignments where `due_date >= today` and no submission for this student) — show list with Upload button.
- Remove standalone "My Assignments" card from student dashboard.
- Documents tab: enforce PDF only + explicit Download button on each row.

## Technical notes
- Add `app_role` extension in a migration for `parent`; no auth.users linkage (parents use enrollment_no + password like students).
- Marks `exam_type` enum: add `class_test_1`, `class_test_2`, `house_test`, `assignment_1`, `assignment_2` (keep old for compat).
- All new tables get `GRANT` + RLS as per project rules.
- Reports render as `<div className="print:...">` pages, use existing `report-export.ts` helpers.

Approve to proceed.