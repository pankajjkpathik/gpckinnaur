# Portal Hardening & Admin Features — Plan

This is a large request. Here is what I will build, in order, so you can confirm before I touch the code.

## 1. Fix "dashboard bounces back to login" (root cause)

The session cookie is being set by `staffLogin`/`studentLogin`, but immediately after, `staffMe`/`studentMe` returns `null` because:
- The login mutation succeeds, then `window.location.href = "/staff-dashboard"` does a full reload.
- The dashboard calls `staffMe()` once via React Query; if it resolves with `null` (race / cookie not yet visible to the next request in some cases), the `useEffect` immediately navigates back to `/staff-login`.

Fix:
- After login, await a verification call to `staffMe()`/`studentMe()` before navigating, so we only redirect once the cookie is confirmed live.
- In the dashboard, only redirect after the query has settled with `data === null` AND `isFetched` is true (avoid race with a stale `null` placeholder).
- Make session cookie `secure: true` always on HTTPS preview (current `NODE_ENV === "production"` check can be false in preview builds).

## 2. Super Admin / Admin features

New route `/staff/admin/users` (gated to `super_admin` + `admin_staff`):
- **Create staff** (username, name, role, department, temp password)
- **Create student** (enrollment no, name, branch, semester, batch year, temp password)
- **Reset password** for any staff/student (generates new temp password, shown once)
- **Disable / enable** account (toggles `is_active`)
- List + search both tables

New route `/staff/admin/timetable`:
- CRUD a simple `timetables` table (branch, semester, day, period, subject, faculty, room). I'll add the table + RLS + GRANTs via migration.

Server functions live in `src/lib/admin.functions.ts`, all guarded by a `requireStaffRole(["super_admin","admin_staff"])` helper.

## 3. Staff dashboard / Student dashboard content

- **Staff home**: greeting, role chip, quick counts (notices, materials, unread contact, pending alumni), shortcuts.
- **Student home**: greeting, enrollment + branch + semester card, list of notices for their branch/semester, study materials for their semester, timetable for their class.

(Existing staff dashboard already has notices/materials/inbox/alumni tabs — I'll keep them and add the admin links for super_admin/admin_staff.)

## 4. Forgot password via email (nodemailer)

Heads up: **Lovable Cloud's server runtime is a Cloudflare Worker. `nodemailer` does not run there** (needs Node TCP/SMTP). Two options:

- **(A, recommended)** Use **Lovable's built-in email infrastructure** (same nodemailer-style "from your domain" deliverability, no API keys, queued + retried). I'll scaffold an auth-email template `staff-password-reset` and `student-password-reset`.
- **(B)** Use a third-party HTTP email API (Resend / SendGrid). Requires you to provide an API key and verified domain.

Flow either way:
- `/forgot-password` page (tabs: Staff / Student) → enter username or enrollment no + email.
- Server fn creates a 1-hour token row in a new `password_reset_tokens` table, emails a link `/reset-password?token=…`.
- `/reset-password` page sets a new password (bcrypt) and invalidates the token.

**I need you to pick A or B before I implement step 4.**

## 5. Change password (already exists for staff, add for students)

- `staffChangePassword` already exists; add a `/staff/change-password` page wired to it.
- Add `studentChangePassword` server fn + `/student/change-password` page.
- Add a "Change password" link in each dashboard's profile menu.

## Open questions

1. **Email provider for forgot-password**: Lovable built-in (recommended) or third-party (Resend/SendGrid)?
2. **Timetable**: simple weekly grid (Day × Period) — OK, or do you want term/section/elective support too?
3. **Who can create users**: only `super_admin`, or also `admin_staff`?

Reply with answers (or just "go with your recommendations") and I'll implement.
