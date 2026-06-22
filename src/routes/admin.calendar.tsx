import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import { listCalendars, upsertCalendar, deleteCalendar } from "@/lib/academic.functions";

export const Route = createFileRoute("/admin/calendar")({
  head: () => portalMeta("Academic Calendar"),
  component: CalendarPage,
});

type DateItem = { date: string; label: string };

function CalendarPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const q = useQuery({ queryKey: ["calendars"], queryFn: () => listCalendars(), enabled: !!me });
  const save = useMutation({ mutationFn: (d: any) => upsertCalendar({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendars"] }); setEditing(null); } });
  const del = useMutation({ mutationFn: (id: number) => deleteCalendar({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["calendars"] }) });
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Academic Calendar" subtitle="Admin · Semester Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setEditing({ exam_dates: [], holidays: [], events: [], published: false })} className="bg-rose-700 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Calendar
          </button>
        </div>

        <div className="space-y-2">
          {(q.data ?? []).map((c: any) => (
            <div key={c.id} className="bg-white border rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{c.academic_year} · {c.semester_label}</p>
                  <p className="text-xs text-muted-foreground">{c.sem_start} → {c.sem_end}</p>
                  <p className="text-xs mt-1">
                    {c.exam_dates?.length ?? 0} exam dates · {c.holidays?.length ?? 0} holidays · {c.events?.length ?? 0} events
                  </p>
                </div>
                <div className="flex gap-1 items-start">
                  <span className={`text-[10px] px-2 py-1 rounded ${c.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{c.published ? <>Published <Eye className="w-3 h-3 inline" /></> : <>Draft <EyeOff className="w-3 h-3 inline" /></>}</span>
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-secondary rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => confirm("Delete calendar?") && del.mutate(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No calendars yet.</p>}
        </div>

        {editing && <CalendarModal initial={editing} onClose={() => setEditing(null)} onSave={(d: any) => save.mutate(d)} pending={save.isPending} error={save.error?.message} />}
      </div>
    </PortalShell>
  );
}

function CalendarModal({ initial, onClose, onSave, pending, error }: any) {
  const [examDates, setExamDates] = useState<DateItem[]>(initial.exam_dates ?? []);
  const [holidays, setHolidays] = useState<DateItem[]>(initial.holidays ?? []);
  const [events, setEvents] = useState<DateItem[]>(initial.events ?? []);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[color:var(--navy)] mb-3">{initial.id ? "Edit" : "New"} Calendar</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSave({
            id: initial.id,
            academic_year: String(f.get("academic_year")),
            semester_label: String(f.get("semester_label")),
            sem_start: String(f.get("sem_start")),
            sem_end: String(f.get("sem_end")),
            exam_dates: examDates,
            holidays,
            events,
            published: f.get("published") === "on",
          });
        }} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <label>Academic Year (YYYY-YY)<input name="academic_year" defaultValue={initial.academic_year} pattern="\d{4}-\d{2}" required placeholder="2025-26" className="w-full border rounded px-3 py-2 mt-1" /></label>
            <label>Semester Label<input name="semester_label" defaultValue={initial.semester_label} required placeholder="Odd / Even" className="w-full border rounded px-3 py-2 mt-1" /></label>
            <label>Semester Start<input name="sem_start" type="date" defaultValue={initial.sem_start} required className="w-full border rounded px-3 py-2 mt-1" /></label>
            <label>Semester End<input name="sem_end" type="date" defaultValue={initial.sem_end} required className="w-full border rounded px-3 py-2 mt-1" /></label>
          </div>
          <DateGroup title="Exam Dates" items={examDates} setItems={setExamDates} />
          <DateGroup title="Holidays" items={holidays} setItems={setHolidays} />
          <DateGroup title="Events" items={events} setItems={setEvents} />
          <label className="flex items-center gap-2"><input name="published" type="checkbox" defaultChecked={initial.published} /> Published (visible to staff & students)</label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Cancel</button>
            <button disabled={pending} className="px-4 py-1.5 bg-rose-700 text-white rounded disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DateGroup({ title, items, setItems }: { title: string; items: DateItem[]; setItems: (x: DateItem[]) => void }) {
  return (
    <div className="border rounded p-2">
      <p className="font-semibold text-sm mb-2">{title}</p>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 mb-1">
          <input type="date" value={it.date} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} className="border rounded px-2 py-1 text-xs" />
          <input value={it.label} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="flex-1 border rounded px-2 py-1 text-xs" />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-destructive p-1"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { date: "", label: "" }])} className="text-xs text-rose-700 mt-1">+ Add</button>
    </div>
  );
}
