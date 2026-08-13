# Security Scan Plan

Address identified security and authorization findings to harden the portal's access controls.

## Authorization & Access Control
- **HOD Cross-Branch Access**: Harden `hodPendingLessonPlans`, `hodPendingMarks`, `hodMarksGroups`, and `hodExportApprovedMarks` to strictly filter by the HOD's own branch.
- **Clerk/Staff Privilege Check**: Ensure clerk operations only touch records within their authorized scope if specific restrictions are added (currently `clerkAccess` is global).
- **Faculty Roster Privacy**: Restrict `classRoster` to only allow faculty to view rosters for classes they actually teach.
- **Assignment Owner Enforcement**: Verify `upsertAssignment` and `deleteAssignment` consistently check `created_by` or roles.

## Data Validation & Input Sanitization
- **Strict Zod Parsing**: Audit all `createServerFn` inputs to ensure no missing `.parse()` calls or weak validators.
- **Bulk Import Guardrails**: Add stricter size limits and row-level validation to all bulk importers to prevent memory/DB exhaustion.

## Technical Details
- Use `deptToBranch` from `src/lib/branch.ts` in HOD functions for reliable branch derivation.
- Apply `assertSubjectAccess` or `assertClassAccess` patterns to all student-data-reading functions in `faculty.functions.ts`.
- Ensure all Supabase Data API calls through `supabaseAdmin` are gated by robust application-level checks since RLS is bypassed.
