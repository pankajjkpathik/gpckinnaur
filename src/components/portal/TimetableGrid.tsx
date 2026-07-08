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
  group_label?: string | null;
  span_periods?: number | null;
  co_staff_ids?: number[] | null;
  subjects?: { code: string; name: string } | null;
  staff_users?: { username: string; name?: string | null } | null;
};
export type TTSubject = { id: number; code: string; name: string };
export type TTStaff = { id: number; username: string; name?: string | null; role?: string };

const DAYS = [
  { v: 1, label: "Mon" }, { v: 2, label: "Tue" }, { v: 3, label: "Wed" },
  { v: 4, label: "Thu" }, { v: 5, label: "Fri" }, { v: 6, label: "Sat" },
];

const CELL_COLORS = [
  "#fde8e8", "#e8f0fe", "#e6f4ea", "#f3e8fd", "#fff4e5",
  "#e0f2f1", "#fce4ec", "#ede7f6", "#e8eaf6", "#f1f8e9",
];
function colorFor(subjectId: number | null | undefined) {
  if (subjectId == null) return "transparent";
  return CELL_COLORS[subjectId % CELL_COLORS.length];
}

export function facultyInitials(staff?: { username: string; name?: string | null } | null) {
  if (!staff) return "";
  const n = staff.name?.trim();
  if (n) {
    const parts = n.split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  }
  return staff.username.slice(0, 2).toUpperCase();
}

function initialsFromStaff(s?: TTStaff | null) {
  if (!s) return "";
  return facultyInitials({ username: s.username, name: s.name });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TimetableGrid({
  periods, slots, subjects, staff, editable = false, onSaveSlot,
  institutionLine, classLine, classInchargeName,
}: {
  periods: TTPeriod[];
  slots: TTSlot[];
  subjects?: TTSubject[];
  staff?: TTStaff[];
  editable?: boolean;
  onSaveSlot?: (payload: {
    day_of_week: number; period_no: number;
    subject_id: number | null; staff_id: number | null; room: string | null;
    group_label: string; span_periods: number; co_staff_ids: number[];
  }) => void;
  institutionLine?: string;
  classLine?: string;
  classInchargeName?: string;
}) {
  // group slots by day+period; can hold 1..2 slots (for G1/G2)
  const slotMap = useMemo(() => {
    const m = new Map<string, TTSlot[]>();
    slots.forEach((s) => {
      const key = `${s.day_of_week}-${s.period_no}`;
      const arr = m.get(key) || [];
      arr.push(s);
      m.set(key, arr);
    });
    return m;
  }, [slots]);

  const staffById = useMemo(() => {
    const m = new Map<number, TTStaff>();
    (staff ?? []).forEach((s) => m.set(s.id, s));
    return m;
  }, [staff]);

  const [editing, setEditing] = useState<{ day: number; period: TTPeriod; slot?: TTSlot; group: string } | null>(null);

  // Legends
  const usedSubjects = useMemo(() => {
    const seen = new Map<string, string>();
    slots.forEach((s) => { if (s.subjects?.code) seen.set(s.subjects.code, s.subjects.name); });
    return Array.from(seen.entries()).sort();
  }, [slots]);
  const usedFaculty = useMemo(() => {
    const seen = new Map<string, string>();
    const add = (sid?: number | null) => {
      if (!sid) return;
      const st = staffById.get(sid);
      if (!st) return;
      seen.set(initialsFromStaff(st), st.name || st.username);
    };
    slots.forEach((s) => {
      add(s.staff_id);
      (s.co_staff_ids ?? []).forEach(add);
    });
    return Array.from(seen.entries()).sort();
  }, [slots, staffById]);

  function facultyLabel(sid?: number | null, fallback?: { username: string; name?: string | null } | null) {
    if (sid && staffById.has(sid)) return initialsFromStaff(staffById.get(sid)!);
    return facultyInitials(fallback);
  }

  function renderSlotContent(s: TTSlot) {
    const code = s.subjects?.code;
    if (!code) return null;
    const primary = facultyLabel(s.staff_id, s.staff_users);
    const cos = (s.co_staff_ids ?? []).map((id) => initialsFromStaff(staffById.get(id))).filter(Boolean);
    const initList = [primary, ...cos].filter(Boolean).join("/");
    return (
      <div className="px-1 leading-tight">
        {s.group_label ? <div className="text-[9px] font-bold text-gray-600">({s.group_label})</div> : null}
        <div className="font-semibold text-gray-800 text-[11px]">{code}</div>
        {initList && <div className="text-[10px] text-gray-500">({initList})</div>}
        {s.room && <div className="text-[9px] text-gray-400">{s.room}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="text-center py-3">
        {institutionLine && <p className="font-bold text-gray-800">{institutionLine}</p>}
        {classLine && <p className="font-semibold text-gray-700 text-sm">{classLine}</p>}
        {classInchargeName && (
          <p className="text-xs text-gray-600 mt-0.5">Class Incharge: <span className="font-semibold">{classInchargeName}</span></p>
        )}
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
            {DAYS.map((d) => {
              let skip = 0;
              return (
                <tr key={d.v}>
                  <td className="border bg-gray-50 px-3 py-3 font-medium text-gray-700">{d.label}</td>
                  {periods.map((p) => {
                    if (skip > 0) { skip--; return null; }
                    if (p.is_break) {
                      return (
                        <td key={p.id} className="border bg-gray-100 text-center align-middle">
                          <span className="text-[9px] font-bold text-gray-500 tracking-wider" style={{ writingMode: "vertical-rl" }}>
                            {p.label || "BREAK"}
                          </span>
                        </td>
                      );
                    }
                    const slotsHere = slotMap.get(`${d.v}-${p.period_no}`) ?? [];
                    const span = Math.max(1, ...slotsHere.map((s) => s.span_periods || 1));
                    // Count how many following non-break periods are covered by this span
                    let colSpan = 1;
                    if (span > 1) {
                      let taken = 0;
                      const startIdx = periods.findIndex((x) => x.id === p.id);
                      for (let i = startIdx + 1; i < periods.length && taken < span - 1; i++) {
                        if (!periods[i].is_break) { colSpan++; taken++; }
                      }
                      skip = colSpan - 1;
                    }
                    if (slotsHere.length === 0) {
                      const first = slotsHere[0];
                      return (
                        <td key={p.id}
                          onClick={() => editable && setEditing({ day: d.v, period: p, slot: undefined, group: "" })}
                          className={`border text-center align-middle h-14 ${editable ? "cursor-pointer hover:ring-2 hover:ring-[#7b1f4c]/40" : ""}`}
                        >
                          {editable ? <span className="text-gray-300 text-lg">+</span> : null}
                        </td>
                      );
                    }
                    if (slotsHere.length === 1) {
                      const s = slotsHere[0];
                      return (
                        <td key={p.id}
                          colSpan={colSpan}
                          onClick={() => editable && setEditing({ day: d.v, period: p, slot: s, group: s.group_label || "" })}
                          className={`border text-center align-middle h-14 ${editable ? "cursor-pointer hover:ring-2 hover:ring-[#7b1f4c]/40" : ""}`}
                          style={{ backgroundColor: colorFor(s.subject_id) }}
                        >
                          {renderSlotContent(s)}
                        </td>
                      );
                    }
                    // Two (or more) groups sharing the same period → stack halves
                    const sorted = [...slotsHere].sort((a, b) => (a.group_label || "").localeCompare(b.group_label || ""));
                    return (
                      <td key={p.id} colSpan={colSpan} className="border p-0 align-middle">
                        <div className="grid grid-rows-2 h-14">
                          {sorted.slice(0, 2).map((s, i) => (
                            <div key={i}
                              onClick={() => editable && setEditing({ day: d.v, period: p, slot: s, group: s.group_label || "" })}
                              className={`flex items-center justify-center ${i === 0 ? "border-b" : ""} ${editable ? "cursor-pointer hover:bg-black/5" : ""}`}
                              style={{ backgroundColor: colorFor(s.subject_id) }}
                            >
                              {renderSlotContent(s)}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
          {classInchargeName && <p className="text-gray-600">{classInchargeName}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold">Principal</p>
          <p className="text-gray-500">Govt. Polytechnic Kinnaur H.P.</p>
        </div>
      </div>

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
  editing: { day: number; period: TTPeriod; slot?: TTSlot; group: string };
  subjects: TTSubject[];
  staff: TTStaff[];
  onClose: () => void;
  onSave: (p: {
    subject_id: number | null; staff_id: number | null; room: string | null;
    group_label: string; span_periods: number; co_staff_ids: number[];
  }) => void;
}) {
  const [subjId, setSubjId] = useState<number | "">(editing.slot?.subject_id ?? "");
  const [staffId, setStaffId] = useState<number | "">(editing.slot?.staff_id ?? "");
  const [room, setRoom] = useState(editing.slot?.room ?? "");
  const [groupLabel, setGroupLabel] = useState<string>(editing.slot?.group_label ?? editing.group ?? "");
  const [span, setSpan] = useState<number>(editing.slot?.span_periods || 1);
  const [coIds, setCoIds] = useState<number[]>(editing.slot?.co_staff_ids ?? []);

  const dayLabel = DAYS.find((d) => d.v === editing.day)?.label;
  const codeForTitle = subjects.find((s) => s.id === subjId)?.code;

  const toggleCo = (id: number) => {
    setCoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-lg">Edit Slot{codeForTitle ? ` — ${codeForTitle}` : ""}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{dayLabel}, Period {editing.period.period_no} — {editing.period.start_time}{editing.period.end_time ? ` - ${editing.period.end_time}` : ""}</p>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <label className="text-gray-600">Subject</label>
            <select value={subjId} onChange={(e) => setSubjId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 bg-white">
              <option value="">— none —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <label className="text-gray-600">Primary Faculty</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 bg-white">
              <option value="">— none —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{initialsFromStaff(s)} - {s.name || s.username}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-start gap-2">
            <label className="text-gray-600 mt-2">Co-Faculty <span className="block text-[10px] text-gray-400">(for practicals)</span></label>
            <div className="border rounded p-2 max-h-32 overflow-y-auto bg-white">
              {staff.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs py-0.5">
                  <input type="checkbox" checked={coIds.includes(s.id)} onChange={() => toggleCo(s.id)} disabled={staffId === s.id} />
                  <span>{initialsFromStaff(s)} — {s.name || s.username}</span>
                </label>
              ))}
              {staff.length === 0 && <p className="text-xs text-gray-400">No faculty found.</p>}
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr_100px_1fr] items-center gap-2">
            <label className="text-gray-600">Group</label>
            <select value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} className="border rounded px-3 py-2 bg-white">
              <option value="">Whole class</option>
              <option value="G1">G1</option>
              <option value="G2">G2</option>
              <option value="G3">G3</option>
            </select>
            <label className="text-gray-600 text-right">Span (periods)</label>
            <input type="number" min={1} max={4} value={span} onChange={(e) => setSpan(Math.max(1, Number(e.target.value) || 1))} className="border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <label className="text-gray-600">Room</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="optional" className="border rounded px-3 py-2" />
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Use <b>Group</b> (G1/G2) to split a practical between two groups in the same period. Use <b>Span</b> for clubbed practical periods (e.g. 2 or 3 consecutive periods). Add <b>Co-Faculty</b> when multiple teachers take the lab together.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="border px-4 py-2 rounded text-sm">Cancel</button>
          <button
            onClick={() =>
              onSave({
                subject_id: subjId || null,
                staff_id: staffId || null,
                room: room || null,
                group_label: groupLabel || "",
                span_periods: span,
                co_staff_ids: coIds,
              })
            }
            className="bg-[#7b1f4c] text-white px-5 py-2 rounded text-sm font-semibold"
          >
            Save Slot
          </button>
        </div>
      </div>
    </div>
  );
}
