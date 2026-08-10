import { saveAssignmentRow } from "./assignment-save.server";

type SlotLike = {
  branch: string;
  semester: number;
  academic_year: string;
  subject_id?: number | null;
  staff_id?: number | null;
  co_staff_ids?: number[] | null;
  guest_faculty?: string | null;
  group_label?: string | null;
};

/**
 * Mirrors a saved timetable slot into faculty_assignments so subject allotment
 * shows up automatically in the HOD and Admin portals. Best-effort: allotment
 * problems must never block saving the timetable itself.
 */
export async function syncAssignmentFromSlot(supabaseAdmin: any, slot: SlotLike) {
  if (!slot.subject_id) return;
  const base = {
    subject_id: slot.subject_id,
    branch: slot.branch,
    semester: slot.semester,
    academic_year: slot.academic_year,
    group_label: slot.group_label || null,
  };

  const staffIds = Array.from(
    new Set([slot.staff_id, ...(slot.co_staff_ids ?? [])].filter(Boolean) as number[]),
  );

  for (const staff_id of staffIds) {
    try {
      await saveAssignmentRow(supabaseAdmin, { ...base, staff_id });
    } catch {
      /* ignore — timetable save must still succeed */
    }
  }

  const guest = (slot.guest_faculty ?? "").trim();
  if (guest) {
    try {
      await saveAssignmentRow(supabaseAdmin, { ...base, staff_id: null, guest_faculty: guest });
    } catch {
      /* ignore */
    }
  }
}

export async function syncAssignmentsFromSlots(supabaseAdmin: any, slots: SlotLike[]) {
  for (const slot of slots) {
    await syncAssignmentFromSlot(supabaseAdmin, slot);
  }
}
