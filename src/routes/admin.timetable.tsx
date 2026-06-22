import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import {
  listPeriods, listSubjects, listStaffByRole, listTimetable, upsertTimetableSlot, publishTimetable,
} from "@/lib/academic.functions";

export const Route = createFileRoute("/admin/timetable")({
  head: () => portalMeta("Timetable Builder"),
  component: TimetablePage,
});

const DAYS = [
  { v: 1, label: "Mon" }, { v: 2, label: "Tue" }, { v: 3, label: "Wed" },
  { v: 4, label: "Thu" }, { v: 5, label: "Fri" }, { v: 6, label: "Sat" },
];

function TimetablePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [branch, setBranch] = useState("civil");
  const [sem, setSem] = useState(1);
  const [year, setYear] = useState("2025-26");

  const periodsQ = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods(), enabled: !!me });
  const subjQ = useQuery({ queryKey: ["subjects-of", branch, sem], queryFn: () => listSubjects({ data: { branch, semester: sem } as any }), enabled: !!me });
  const staffQ = useQuery({ queryKey: ["staff-all"], queryFn: () => listStaffByRole({ data: {} as any }), enabled: !!me });
  const ttQ = useQuery({
    queryKey: ["timetable", branch, sem, year],
    queryFn: () => listTimetable({ data: { branch, semester: sem, academic_year: year } }),
    enabled: !!me,
  });

  const save = useMutation({
    mutationFn: (d: any) => upsertTimetableSlot({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
  const pub = useMutation({
    mutationFn: (p: boolean) => publishTimetable({ data: { branch, semester: sem, academic_year: year, published: p } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });

  const grid = useMemo(() => {
    const map = new Map<string, any>();
    (ttQ.data ?? []).forEach((s: any) => map.set(`${s.day_of_week}-${s.period_no}`, s));
    return map;
  }, [ttQ.data]);

  const isPublished = (ttQ.data ?? []).some((s: any) => s.published);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Timetable Builder" subtitle="Admin · Weekly Schedule" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="bg-white border rounded p-3 flex flex-wrap gap-2 items-center">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-white">
            {["civil","mechanical","applied_science"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={sem} onChange={(e) => setSem(Number(e.target.value))} className="border rounded px-2 py-1.5 text-sm bg-white">
            {[1,2,3,4,5,6].map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <input value={year} onChange={(e) => setYear(e.target.value)} pattern="\d{4}-\d{2}" className="border rounded px-2 py-1.5 text-sm w-24" />
          <span className={`text-xs px-2 py-1 rounded ml-auto ${isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {isPublished ? <>Published <Eye className="w-3 h-3 inline" /></> : <>Draft <EyeOff className="w-3 h-3 inline" /></>}
          </span>
          <button disabled={pub.isPending} onClick={() => pub.mutate(!isPublished)} className="bg-rose-700 text-white px-3 py-1.5 rounded text-sm font-semibold disabled:opacity-50">
            {isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>

        {save.error && <p className="text-xs text-destructive bg-rose-50 border border-rose-200 rounded p-2">{save.error.message}</p>}

        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary">
              <tr>
                <th className="px-2 py-2 text-left">Period</th>
                {DAYS.map((d) => <th key={d.v} className="px-2 py-2 text-left">{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {(periodsQ.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-2 bg-secondary/40">
                    <div className="font-bold">{p.period_no}</div>
                    <div className="text-[10px] text-muted-foreground">{p.start_time}–{p.end_time}</div>
                    {p.label && <div className="text-[10px]">{p.label}</div>}
                  </td>
                  {DAYS.map((d) => {
                    const slot = grid.get(`${d.v}-${p.period_no}`);
                    return (
                      <td key={d.v} className="px-1 py-1 align-top min-w-[140px]">
                        <SlotCell
                          slot={slot}
                          period={p}
                          day={d.v}
                          subjects={subjQ.data ?? []}
                          staff={staffQ.data ?? []}
                          onSave={(payload) => save.mutate({ branch, semester: sem, day_of_week: d.v, period_no: p.period_no, academic_year: year, ...payload })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {(periodsQ.data ?? []).length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Configure Periods Master first.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

function SlotCell({ slot, subjects, staff, onSave, period }: any) {
  const [subjId, setSubjId] = useState<number | "">(slot?.subject_id ?? "");
  const [staffId, setStaffId] = useState<number | "">(slot?.staff_id ?? "");
  const [room, setRoom] = useState<string>(slot?.room ?? "");
  if (period?.is_break) return <div className="text-center text-muted-foreground italic">{period.label || "Break"}</div>;
  return (
    <div className="space-y-1">
      <select value={subjId} onChange={(e) => setSubjId(e.target.value ? Number(e.target.value) : "")} className="w-full border rounded px-1 py-0.5 bg-white">
        <option value="">— subject —</option>
        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.code}</option>)}
      </select>
      <select value={staffId} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")} className="w-full border rounded px-1 py-0.5 bg-white">
        <option value="">— faculty —</option>
        {staff.filter((s: any) => ["faculty","hod"].includes(s.role)).map((s: any) => <option key={s.id} value={s.id}>{s.username}</option>)}
      </select>
      <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room" className="w-full border rounded px-1 py-0.5" />
      <button onClick={() => onSave({ subject_id: subjId || null, staff_id: staffId || null, room: room || null })} className="w-full bg-rose-100 text-rose-800 rounded px-1 py-0.5 text-[10px] font-semibold">Save</button>
    </div>
  );
}
