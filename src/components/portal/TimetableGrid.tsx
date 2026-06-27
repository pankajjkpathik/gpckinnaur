import { useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type TTPeriod = {
  id: number;
  period_no: number;
  start_time: string | null;
  end_time: string | null;
  label: string | null;
  is_break: boolean | null;
};
export type TTSlot = {
  id?: number;
  day_of_week: number;
  period_no: number;
  subject_id: number | null;
  staff_id: number | null;
  room?: string | null;
  subjects?: { code: string; name: string } | null;
  staff_users?: { username: string; name?: string | null } | null;
};
export type TTSubject = { id: number; code: string; name: string };
export type TTStaff = { id: number; username: string; name?: string | null; role?: string };

const DAYS = [
  { v: 1, label: "Mon" }, { v: 2, label: "Tue" }, { v: 3, label: "Wed" },
  { v: 4, label: "Thu" }, { v: 5, label: "Fri" }, { v: 6, label: "Sat" },
];

// Soft pastel palette keyed by subject id, mimicking the reference timetable.
const CELL_COLORS = [
  "#fde8e8", "#e8f0fe", "#e6f4ea", "#f3e8fd", "#fff4e5",
  "#e0f2f1", "#fce4ec", "#ede7f6", "#e8eaf6", "#f1f8e9",
];
function colorFor(subjectId: number | null | undefined) {
  if (subjectId == null) return "transparent";
  return CELL_COLORS[subjectId % CELL_COLORS.length];
}

// Faculty initials, e.g. "Rohit Tiwari" → "RT", else username.
export function facultyInitials(staff?: { username: string; name?: string | null } | null) {
  if (!staff) return "";
  const n = staff.name?.trim();
  if (n) {
    const parts = n.split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  }
  return staff.username.slice(0, 2).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TimetableGrid({
  periods, slots, subjects, staff, editable = false, onSaveSlot, institutionLine, classLine, effectiveFrom,
}: {
  periods: TTPeriod[];
  slots: TTSlot[];
  subjects?: TTSubject[];
  staff?: TTStaff[];
  editable?: boolean;
  onSaveSlot?: (payload: { day_of_week: number; period_no: number; subject_id: number | null; staff_id: number | null; room: string | null }) => void;
  institutionLine?: string;
  classLine?: string;
  effectiveFrom?: string;
}) {
  const slotMap = useMemo(() => {
    const m = new Map<string, TTSlot>();
    slots.forEach((s) => m.set(`${s.day_of_week}-${s.period_no}`, s));
    return m;
  }, [slots]);

  const [editing, setEditing] = useState<{ day: number; period: TTPeriod; slot?: TTSlot } | null>(null);

  const teaching = periods.filter((p) => !p.is_break);

  // Build the subjects + faculty legends from what's actually placed.
  const usedSubjects = useMemo(() => {
    const seen = new Map<string, string>();
    slots.forEach((s) => { if (s.subjects?.code) seen.set(s.subjects.code, s.subjects.name); });
    return Array.from(seen.entries()).sort();
  }, [slots]);
  const usedFaculty = useMemo(() => {
    const seen = new Map<string, string>();
    slots.forEach((s) => {
      if (s.staff_users) {
        const init = facultyInitials(s.staff_users);
        seen.set(init, s.staff_users.name || s.staff_users.username);
      }
    });
    return Array.from(seen.entries()).sort();
  }, [slots]);

  return (
    <div className="bg-white">
      {/* Institution header */}
      <div className="text-center py-3">
        {institutionLine && <p className="font-bold text-gray-800">{institutionLine}</p>}
        {classLine && <p className="font-semibold text-gray-700 text-sm">{classLine}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border bg-gray-50 px-3 py-2 text-gray-600 font-semibold text-left min-w-[64px]">Day</th>
              {periods.map((p) => (
                <th key={p.id} className="border bg-gray-50 px-2 py-2 text-center font-semibold text-gray-600 min-w-[92px]">
                  {p.is_break ? "" : <div>{p.period_no}</div>}
                  <div className="text-[10px] font-normal text-gray-400">{p.start_time}{p.end_time ? ` - ${p.end_time}` : ""}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => (
              <tr key={d.v}>
                <td className="border bg-gray-50 px-3 py-3 font-medium text-gray-700">{d.label}</td>
                {periods.map((p) => {
                  if (p.is_break) {
                    // Render the break label once (vertical) per column — show on every row cell as a thin band.
                    return (
                      <td key={p.id} className="border bg-gray-100 text-center align-middle">
                        <span className="text-[9px] font-bold text-gray-500 tracking-wider" style={{ writingMode: "vertical-rl" }}>
                          {p.label || "BREAK"}
                        </span>
                      </td>
                    );
                  }
                  const slot = slotMap.get(`${d.v}-${p.period_no}`);
                  const code = slot?.subjects?.code;
                  const init = facultyInitials(slot?.staff_users);
                  const filled = !!code;
                  return (
                    <td
                      key={p.id}
                      onClick={() => editable && setEditing({ day: d.v, period: p, slot })}
                      className={`border text-center align-middle h-14 ${editable ? "cursor-pointer hover:ring-2 hover:ring-[#7b1f4c]/40" : ""}`}
                      style={{ backgroundColor: colorFor(slot?.subject_id) }}
                    >
                      {filled ? (
                        <div className="px-1">
                          <div className="font-semibold text-gray-800">{code}</div>
                          {init && <div className="text-[10px] text-gray-500">({init})</div>}
                          {slot?.room && <div className="text-[9px] text-gray-400">{slot.room}</div>}
                        </div>
                      ) : editable ? (
                        <span className="text-gray-300 text-lg">+</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legends */}
      {(usedSubjects.length > 0 || usedFaculty.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6 mt-5 px-2 text-xs">
          {usedSubjects.length > 0 && (
            <div>
              <p className="font-bold underline mb-1">SUBJECTS:-</p>
              <div className="space-y-0.5">
                {usedSubjects.map(([code, name]) => (
                  <p key={code}><span className="font-semibold">{code} :</span> {name}</p>
                ))}
              </div>
            </div>
          )}
          {usedFaculty.length > 0 && (
            <div>
              <p className="font-bold underline mb-1">FACULTY:-</p>
              <div className="space-y-0.5">
                {usedFaculty.map(([init, name]) => (
                  <p key={init}><span className="font-semibold">{init} :</span> {name}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature lines */}
      <div className="flex justify-between mt-8 px-2 text-xs">
        <div>
          <p className="font-bold">Officer Incharge</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Principal</p>
          <p className="text-gray-500">Govt. Polytechnic Kinnaur H.P.</p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && editable && (
        <EditSlotModal
          editing={editing}
          subjects={subjects ?? []}
          staff={(staff ?? []).filter((s) => !s.role || ["faculty", "hod"].includes(s.role))}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            onSaveSlot?.({ day_of_week: editing.day, period_no: editing.period.period_no, ...payload });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditSlotModal({ editing, subjects, staff, onClose, onSave }: {
  editing: { day: number; period: TTPeriod; slot?: TTSlot };
  subjects: TTSubject[];
  staff: TTStaff[];
  onClose: () => void;
  onSave: (p: { subject_id: number | null; staff_id: number | null; room: string | null }) => void;
}) {
  const [subjId, setSubjId] = useState<number | "">(editing.slot?.subject_id ?? "");
  const [staffId, setStaffId] = useState<number | "">(editing.slot?.staff_id ?? "");
  const [room, setRoom] = useState(editing.slot?.room ?? "");
  const dayLabel = DAYS.find((d) => d.v === editing.day)?.label;
  const codeForTitle = subjects.find((s) => s.id === subjId)?.code;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-lg">Edit Slot{codeForTitle ? ` for ${codeForTitle}` : ""}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{dayLabel}, {editing.period.start_time}{editing.period.end_time ? ` - ${editing.period.end_time}` : ""}</p>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <label className="text-gray-600">Subject</label>
            <select value={subjId} onChange={(e) => setSubjId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 bg-white">
              <option value="">— none —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <label className="text-gray-600">Faculty</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 bg-white">
              <option value="">— none —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{facultyInitials(s)} - {s.name || s.username}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <label className="text-gray-600">Room</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="optional" className="border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="border px-4 py-2 rounded text-sm">Cancel</button>
          <button onClick={() => onSave({ subject_id: subjId || null, staff_id: staffId || null, room: room || null })} className="bg-[#7b1f4c] text-white px-5 py-2 rounded text-sm font-semibold">Save Slot</button>
        </div>
      </div>
    </div>
  );
}
