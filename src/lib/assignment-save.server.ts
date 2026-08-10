type AssignmentInput = {
  staff_id?: number | null;
  subject_id: number;
  branch: string;
  semester: number;
  academic_year: string;
  guest_faculty?: string | null;
  guest_institute?: string | null;
  group_label?: string | null;
};

/**
 * Saves a faculty allotment row. Internal staff rows upsert on the composite
 * unique key; guest-faculty rows (no staff_id) are de-duplicated manually since
 * NULL staff_id never conflicts in Postgres.
 */
export async function saveAssignmentRow(supabaseAdmin: any, input: AssignmentInput) {
  const guest = (input.guest_faculty ?? "").trim();
  const isGuest = !input.staff_id;

  const row = {
    staff_id: isGuest ? null : input.staff_id!,
    subject_id: input.subject_id,
    branch: input.branch,
    semester: input.semester,
    academic_year: input.academic_year,
    guest_faculty: isGuest ? guest : null,
    guest_institute: isGuest ? (input.guest_institute ?? "").trim() || null : null,
    group_label: input.group_label || null,
  };

  if (!isGuest) {
    const { error } = await supabaseAdmin
      .from("faculty_assignments")
      .upsert(row, { onConflict: "staff_id,subject_id,branch,semester,academic_year" });
    if (error) throw new Error(error.message);
    return;
  }

  if (!guest) throw new Error("Guest faculty name is required.");

  const { data: existing } = await supabaseAdmin
    .from("faculty_assignments")
    .select("id, guest_faculty")
    .is("staff_id", null)
    .eq("subject_id", row.subject_id)
    .eq("branch", row.branch)
    .eq("semester", row.semester)
    .eq("academic_year", row.academic_year);

  const match = (existing ?? []).find(
    (r: any) => (r.guest_faculty ?? "").trim().toLowerCase() === guest.toLowerCase(),
  );

  if (match) {
    const { error } = await supabaseAdmin
      .from("faculty_assignments")
      .update({ guest_institute: row.guest_institute })
      .eq("id", match.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabaseAdmin.from("faculty_assignments").insert(row);
  if (error) throw new Error(error.message);
}
