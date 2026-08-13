# Plan: Fix Faculty Subject Visibility in Portal

The faculty portal is failing to show assigned subjects in Record Attendance and Marks entry sections despite assignments being made. This is likely due to the application of a session filter (2026-27) that might not match the actual data in the `faculty_assignments` table, or a cache issue with the `listAssignments` function.

## Proposed Changes

### 1. Hardening Server Functions
- **File**: `src/lib/faculty.functions.ts`
- **Action**: Update `facultyDashboard` to return all assignments if the specific year query fails, and ensure `getAttendance`/`getMarks` are more resilient to year mismatches.
- **Action**: Ensure `assertSubjectAccess` properly handles guest faculty and year-agnostic checks where appropriate.

### 2. UI Robustness in Faculty Portal
- **File**: `src/routes/faculty.tsx`
- **Action**: Update `AttendanceView` and `MarksView` to fallback to the `assignments` list provided by the `facultyDashboard` query if `listAssignments` returns empty.
- **Action**: Explicitly pass the active session year to all academic queries to ensure synchronization.
- **Action**: Add a "Refresh Data" button or mechanism to force refetching of assignments.

### 3. Debugging and Verification
- **Action**: Use `supabase--read_query` to verify the content of `faculty_assignments` for the current user and session.
- **Action**: Verify that the `academic_year` string format in the database ("2026-27") exactly matches what is being sent by the UI.

## Technical Details
- The portal currently uses `useActiveSession()` which returns `2026-27`. I will verify if the database has records with this exact string.
- I will ensure `listAssignments` (from `academic.functions.ts`) isn't being shadowed or misconfigured in the Faculty views.
- I will update the command text in `admin.timetable.tsx` to reflect the progress.
