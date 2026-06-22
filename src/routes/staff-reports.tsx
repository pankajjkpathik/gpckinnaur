import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { templatesList, templateDownload } from "@/lib/report-templates.functions";

export const Route = createFileRoute("/staff-reports")({
  head: () => ({ meta: [{ title: "Report Templates — Staff · GP Kinnaur" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StaffReports,
});

const KIND_LABEL: Record<string, string> = {
  monthly_attendance: "Monthly Attendance",
  mid_sessional: "Mid-Semester Sessional",
  final_sessional: "Semester Final Sessional",
  external_practical: "External Practical Awards",
  other: "Other",
};

function StaffReports() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => { if (!isLoading && !me) nav({ to: "/staff-login" }); }, [me, isLoading, nav]);
  const list = useQuery({ queryKey: ["staff-templates"], queryFn: () => templatesList(), enabled: !!me });

  const [branch, setBranch] = useState("civil");
  const [semester, setSemester] = useState(1);
  const [busy, setBusy] = useState<number | null>(null);

  async function download(id: number, name: string) {
    setBusy(id);
    try {
      const r = await templateDownload({ data: { id, branch, semester } });
      const bin = atob(r.file_b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const wb = XLSX.read(bytes, { type: "array" });
      // Inject roster sheet
      const rosterData: any[][] = [["S.No","Enrollment No","Name","Father's Name"]];
      r.roster.forEach((s: any, i: number) => rosterData.push([i + 1, s.enrollment_no, s.name, s.father_name ?? ""]));
      const ws = XLSX.utils.aoa_to_sheet(rosterData);
      if (wb.Sheets["Roster"]) delete wb.Sheets["Roster"];
      const idx = wb.SheetNames.indexOf("Roster");
      if (idx >= 0) wb.SheetNames.splice(idx, 1);
      XLSX.utils.book_append_sheet(wb, ws, "Roster");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "_")}_${branch}_sem${semester}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[color:var(--gold)] font-semibold uppercase">Staff · Report Templates</p>
            <p className="font-bold">Download prescribed .xlsx with class roster pre-filled</p>
          </div>
          <Link to="/staff-dashboard" className="text-sm px-3 py-1.5 border border-white/40 rounded">← Dashboard</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="bg-white border rounded p-3 flex flex-wrap gap-3 items-end">
          <label className="text-xs">Branch
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="block border rounded px-2 py-1.5 text-sm bg-white">
              <option value="civil">Civil</option><option value="mechanical">Mechanical</option><option value="applied_science">Applied Science</option>
            </select>
          </label>
          <label className="text-xs">Semester
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="block border rounded px-2 py-1.5 text-sm bg-white">
              {[1,2,3,4,5,6].map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">The downloaded workbook keeps every original sheet and adds a fresh "Roster" sheet with the selected class roster.</p>
        </div>

        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Kind</th>
              <th className="px-3 py-2 text-left">File</th>
              <th></th>
            </tr></thead>
            <tbody>
              {(list.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td className="px-3 py-2 text-xs inline-flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> {r.file_name}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => download(r.id, r.name)} disabled={busy === r.id} className="text-xs px-2 py-1 bg-[color:var(--navy)] text-white rounded inline-flex items-center gap-1 disabled:opacity-50">
                      <Download className="w-3.5 h-3.5" /> {busy === r.id ? "Preparing…" : "Download w/ Roster"}
                    </button>
                  </td>
                </tr>
              ))}
              {(list.data ?? []).length === 0 && <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No templates available. Ask the admin to upload formats.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
