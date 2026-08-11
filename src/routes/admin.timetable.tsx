import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Printer, ArrowLeft } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { useActiveSession } from "@/lib/use-active-session";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import {
  listPeriods,
  listSubjects,
  listStaffByRole,
  listTimetable,
  upsertTimetableSlot,
  publishTimetable,
  deleteTimetableSlot,

} from "@/lib/academic.functions";
import { TimetableGrid } from "@/components/portal/TimetableGrid";
import logoAsset from "@/assets/logo.png.asset.json";
import hpAsset from "@/assets/hp.png.asset.json";


export const Route = createFileRoute("/admin/timetable")({
  head: () => portalMeta("Timetable Builder"),
  component: TimetablePage,
});

const BRANCH_LABELS: Record<string, string> = {
  civil: "Civil Engineering",
  mechanical: "Mechanical Engineering",
};
const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

function TimetablePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [branch, setBranch] = useState("mechanical");
  const [sem, setSem] = useState(3);
  const activeSession = useActiveSession();
  const [year, setYear] = useState(activeSession.year);
  const [ciId, setCiId] = useState<number | "">("");
  const yearMismatch = year !== activeSession.year;



  const periodsQ = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods(), enabled: !!me });
  // Each branch keeps its own subject set per semester (including semesters 1
  // and 2, even when subject codes overlap between Civil and Mechanical). Keep
  // the filter strict on branch+semester so each diploma gets its own picker.
  const subjQ = useQuery({
    queryKey: ["subjects-of", branch, sem],
    queryFn: () => listSubjects({ data: { branch, semester: sem } as any }),
    enabled: !!me,
  });
  const staffQ = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => listStaffByRole({ data: {} as any }),
    enabled: !!me,
  });
  const ttQ = useQuery({
    queryKey: ["timetable", branch, sem, year],
    queryFn: () => listTimetable({ data: { branch, semester: sem, academic_year: year } }),
    enabled: !!me,
  });

  const save = useMutation({
    mutationFn: (d: any) => {
      if (yearMismatch) {
        return Promise.reject(
          new Error(
            `Timetable entries must be saved into the active session (${activeSession.year}). Switch back to save.`,
          ),
        );
      }
      return upsertTimetableSlot({ data: { branch, semester: sem, academic_year: year, ...d } });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["timetable", branch, sem, year] });
      await qc.refetchQueries({ queryKey: ["timetable", branch, sem, year] });
    },
  });

  const del = useMutation({
    mutationFn: (p: { id: number; branch: string }) => deleteTimetableSlot({ data: p }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["timetable", branch, sem, year] });
      await qc.refetchQueries({ queryKey: ["timetable", branch, sem, year] });
    },
  });

  const pub = useMutation({
    mutationFn: (p: boolean) =>
      publishTimetable({ data: { branch, semester: sem, academic_year: year, published: p } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });


  const isPublished = (ttQ.data ?? []).some((s: any) => s.published);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const classLabel = `${BRANCH_LABELS[branch] ?? branch} - ${ORDINAL[sem]} Semester`;

  return (
    <PortalShell title="Timetable Builder" subtitle="Admin · Weekly Schedule" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 hover:bg-gray-50 bg-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Console
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="border rounded px-3 py-2 text-sm bg-white"
            >
              {Object.keys(BRANCH_LABELS).map((b) => (
                <option key={b} value={b}>
                  {BRANCH_LABELS[b]}
                </option>
              ))}
            </select>
            <select
              value={sem}
              onChange={(e) => setSem(Number(e.target.value))}
              className="border rounded px-3 py-2 text-sm bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {ORDINAL[s]} Sem
                </option>
              ))}
            </select>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              pattern="\d{4}-\d{2}"
              className="border rounded px-3 py-2 text-sm w-24"
            />
            <select
              value={ciId}
              onChange={(e) => setCiId(e.target.value ? Number(e.target.value) : "")}
              className="border rounded px-3 py-2 text-sm bg-white max-w-[180px]"
              title="Class Incharge"
            >
              <option value="">— Class Incharge —</option>
              {(staffQ.data ?? [])
                .filter((s: any) => !s.role || ["faculty", "hod"].includes(s.role))
                .map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name || s.username}</option>
                ))}
            </select>

            <span
              className={`text-xs px-2 py-1 rounded ${isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              {isPublished ? (
                <>
                  Published <Eye className="w-3 h-3 inline" />
                </>
              ) : (
                <>
                  Draft <EyeOff className="w-3 h-3 inline" />
                </>
              )}
            </span>
            <button
              disabled={pub.isPending}
              onClick={() => pub.mutate(!isPublished)}
              className="bg-rose-700 text-white px-3 py-2 rounded text-sm font-semibold disabled:opacity-50"
            >
              {isPublished ? "Unpublish" : "Publish"}
            </button>
            <button
              onClick={() => window.print()}
              className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-800">Timetable</h1>
          <p className="text-xs text-gray-400">
            View and edit the weekly schedule for any class. Click any slot to edit. Effective from 01-08-2026.
          </p>
        </div>

        {yearMismatch && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            You are viewing session {year}, but the active session is {activeSession.year} (starts {activeSession.startDate}). Saving is disabled until you switch back.
          </p>
        )}
        {save.error && (

          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{save.error.message}</p>
        )}
        {del.error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{del.error.message}</p>
        )}
        {ttQ.error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
            Could not load timetable entries: {ttQ.error.message}
          </p>
        )}
        {(save.isPending || del.isPending || ttQ.isFetching) && (
          <p className="text-xs text-gray-600 bg-gray-50 border rounded p-2">Refreshing timetable…</p>
        )}
        {save.isSuccess && !save.isPending && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            Timetable entry saved and refreshed.
          </p>
        )}
        {del.isSuccess && !del.isPending && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            Timetable entry deleted and refreshed.
          </p>
        )}


        <div className="bg-white border rounded-lg p-4 tt-print-area">
          {/* Print-only header with institute logos */}
          <div className="hidden print:flex items-center justify-between gap-4 mb-3 pb-2 border-b border-gray-800">
            <img src={hpAsset.url} alt="HP" className="w-14 h-14 object-contain" />
            <div className="text-center">
              <p className="text-[13px] font-bold uppercase tracking-wide">Government of Himachal Pradesh</p>
              <p className="text-[15px] font-extrabold">Govt. Polytechnic Kinnaur, Camp at GP Rohru Distt. Shimla (H.P.)</p>
              <p className="text-[12px] font-semibold">Time Table {classLabel} · w.e.f. 01-08-{year.split("-")[0]}</p>
            </div>
            <img src={logoAsset.url} alt="GPK" className="w-14 h-14 object-contain" />
          </div>
          {(periodsQ.data ?? []).length === 0 && (
            <p className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 print:hidden">
              No bell schedule configured (Admin → Periods). Showing a default 8-period grid so existing entries stay visible.
            </p>
          )}
          <TimetableGrid
            periods={(periodsQ.data ?? []) as any}
            slots={(ttQ.data ?? []) as any}
            subjects={subjQ.data as any}
            staff={staffQ.data as any}
            editable
            onSaveSlot={(p) => save.mutate(p)}
            onDeleteSlot={(p) => del.mutateAsync(p).then(() => undefined)}

            institutionLine="Govt. Polytechnic Kinnaur, Camp at GP Rohru Distt. Shimla (H.P.)"
            classLine={classLabel}
            classInchargeName={(() => {
              const s = (staffQ.data ?? []).find((x: any) => x.id === ciId) as any;
              return s ? (s.name || s.username) : undefined;
            })()}
          />

        </div>

        <style>{`
          @media print {
            @page { size: A4 landscape; margin: 8mm; }
            html, body { background: #fff !important; }
            body * { visibility: hidden !important; }
            .tt-print-area, .tt-print-area * { visibility: visible !important; }
            .tt-print-area { position: absolute; inset: 0; border: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; width: 100%; }
            .tt-print-area table { font-size: 9px !important; page-break-inside: avoid; }
            .tt-print-area th, .tt-print-area td { padding: 3px 4px !important; }
          }
        `}</style>

      </div>
    </PortalShell>
  );
}
