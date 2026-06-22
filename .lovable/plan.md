# Staff Portal Overhaul — Phased Plan

## Phase 1 (this turn) — Access Control + Quick Wins
- **Role-based gating** on every portal route. Faculty cannot reach `/hod`, `/principal`, `/admin`, `/admin-users`, `/clerk`. Likewise for HOD, Principal, Clerk.
- **Staff dashboard sidebar** only shows the *one* portal the user owns + read-only "Views" for higher roles.
- **Merge Admin + Super Admin behavior**: `admin_staff` gets the same admin-only experience as `super_admin` and loses access to other portals.
- **Clerk loses Admin Console** access entirely.
- **Faculty attendance**: cannot mark past dates (date input min = today).
- **Faculty marks**: add `first_class_test`, `second_class_test`, `house_test` to exam types.
- **HOD / Principal renames**: "Faculty Portal" → "Faculty View", "HOD Portal" → "HOD View", "Principal Portal" → "Principal View" in higher-role contexts; underlying views become read-only.
- **Remove Study Material** tab/link from Principal portal.

## Phase 2 — Charts on dashboards
- Add `recharts` (already in many Lovable templates) and replace stat cards on Faculty, HOD, Principal, Student dashboards with bar/line/pie charts (attendance trends, marks distribution, dept pass %, etc.).

## Phase 3 — Direct Messaging (1:1, DB-polling)
- New `messages` table (sender_role/id, recipient_role/id, body, read_at).
- "Messages" tab in every portal: compose, inbox, sent. 30 s polling.

## Phase 4 — Clerk Bulk Excel + Salary  ✅ done
- `clerkBulkImportStudents` now accepts .xlsx upload (SheetJS) in addition to CSV paste.
- "Download Sample.xlsx" button in Clerk Import tab.
- Admin Users page: Delete buttons for staff (super-admin) and students.
- New `staff_salary` table + Clerk "Salary" tab with month/year filter, upsert, delete, export to xlsx.

## Phase 6 — Admin Upload Formats  ✅ done
- New `report_templates` table (kind: monthly_attendance / mid_sessional / final_sessional / external_practical / other) storing base64 xlsx.
- `/admin/report-templates` admin route: upload, list, delete.
- `/staff-reports` route for every staff role: pick branch+semester, download a copy of the template with class roster appended as a "Roster" sheet.

## Phase 5 — Department-wise display
- Add a Department filter (Civil / Mechanical / Applied Science) to every attendance & marks list in HOD/Principal/Admin.

## Phase 6 — Admin Upload Formats
- New `report_templates` table (name, kind, xlsx_storage_path).
- Admin uploads .xlsx; Faculty downloads a pre-filled copy with class roster injected (Monthly Attendance, Mid-Sessional, Final Sessional, External Practical).

## Phase 7 — Student dashboard charts
- Same recharts upgrade for the student "Home" tab.
