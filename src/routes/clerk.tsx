import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Upload, ArrowUpCircle, Download, FileSpreadsheet, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { HeroBanner } from "@/components/portal/HeroBanner";
import { clerkRoles, hasRole } from "@/lib/roles";
import {
  clerkListStudents,
  clerkUpdateStudent,
  clerkBulkImportStudents,
  clerkPromoteStudents,
} from "@/lib/clerk.functions";
import { adminCreateStudent } from "@/lib/admin.functions";
import { salaryList, salaryUpsert, salaryDelete, salaryStaffList } from "@/lib/salary.functions";

export const Route = createFileRoute("/clerk")({
  head: () => portalMeta("Clerk Portal"),
  component: ClerkPortal,
});

type Tab = "students" | "import" | "promote" | "salary";

function ClerkPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, clerkRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);
  const [tab, setTab] = useState<Tab>("students");
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Clerk Portal" subtitle="Master Records" me={me as any} accent="amber">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-1 border-b flex-wrap">
          {(
            [
              ["students", "Students"],
              ["import", "Bulk Import"],
              ["promote", "Promote"],
              ["salary", "Salary"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === k ? "border-amber-600 text-amber-700 font-semibold" : "border-transparent text-muted-foreground"}`}
            >
              {l}
            </button>
          ))}
          <Link to="/admin-users" className="ml-auto text-sm text-amber-700 underline px-3 py-2">
            User accounts →
          </Link>
        </div>
        {tab === "students" && <StudentsTab />}
        {tab === "import" && <ImportTab />}
        {tab === "promote" && <PromoteTab />}
        {tab === "salary" && <SalaryTab />}
      </div>
    </PortalShell>
  );
}

function StudentsTab() {
  const qc = useQueryClient();
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const list = useQuery({
    queryKey: ["clerk-students", branch, sem, q],
    queryFn: () =>
      clerkListStudents({
        data: { branch: branch || undefined, semester: sem || undefined, q: q || undefined } as any,
      }),
  });
  const create = useMutation({
    mutationFn: (d: any) => adminCreateStudent({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
      setAdding(false);
    },
  });
  const update = useMutation({
    mutationFn: (d: any) => clerkUpdateStudent({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
      setEditing(null);
    },
  });

  const exportCsv = () => {
    const rows = list.data ?? [];
    const header = [
      "enrollment_no",
      "name",
      "father_name",
      "branch",
      "semester",
      "batch_year",
      "email",
      "phone",
      "address",
      "guardian_phone",
    ];
    const csv = [header.join(",")]
      .concat(rows.map((r: any) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / enrollment"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="">All branches</option>
          {["civil", "mechanical", "applied_science"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={sem}
          onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="">All sems</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Sem {s}
            </option>
          ))}
        </select>
        <button onClick={exportCsv} className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-600 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Enrollment</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Sem</th>
              <th className="px-3 py-2 text-left">Batch</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono">{r.enrollment_no}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2">{r.batch_year}</td>
                <td className="px-3 py-2 text-xs">
                  {r.phone ?? "—"} · {r.email ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(r)} className="p-1.5 hover:bg-secondary rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(list.data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-muted-foreground">
                  No students match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {adding && (
        <StudentFormModal
          title="Add Student"
          requirePassword
          onClose={() => setAdding(false)}
          onSave={(d: any) => create.mutate(d)}
          pending={create.isPending}
          error={create.error?.message}
        />
      )}
      {editing && (
        <StudentFormModal
          title={`Edit ${editing.enrollment_no}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(d: any) => update.mutate({ id: editing.id, ...d })}
          pending={update.isPending}
          error={update.error?.message}
        />
      )}
    </div>
  );
}

function StudentFormModal({ title, initial = {}, requirePassword = false, onClose, onSave, pending, error }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-[color:var(--navy)] mb-3">{title}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const out: any = {
              enrollment_no: String(f.get("enrollment_no") || initial.enrollment_no || ""),
              name: String(f.get("name")),
              father_name: String(f.get("father_name") || ""),
              branch: String(f.get("branch")),
              semester: Number(f.get("semester")),
              batch_year: Number(f.get("batch_year")),
              email: String(f.get("email") || ""),
              phone: String(f.get("phone") || ""),
              address: String(f.get("address") || ""),
              guardian_phone: String(f.get("guardian_phone") || ""),
              dob: String(f.get("dob") || "") || null,
              admission_date: String(f.get("admission_date") || "") || null,
            };
            if (requirePassword) out.password = String(f.get("password"));
            onSave(out);
          }}
          className="grid grid-cols-2 gap-2 text-sm"
        >
          {requirePassword && (
            <input
              name="enrollment_no"
              required
              placeholder="Enrollment No"
              defaultValue={initial.enrollment_no}
              className="border rounded px-3 py-2 col-span-2"
            />
          )}
          <input
            name="name"
            required
            placeholder="Full Name"
            defaultValue={initial.name}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="father_name"
            placeholder="Father's Name"
            defaultValue={initial.father_name ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <select
            name="branch"
            required
            defaultValue={initial.branch ?? "civil"}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value="civil">Civil</option>
            <option value="mechanical">Mechanical</option>
            <option value="applied_science">Applied Science</option>
          </select>
          <input
            name="semester"
            type="number"
            min={1}
            max={8}
            required
            defaultValue={initial.semester ?? 1}
            className="border rounded px-3 py-2"
          />
          <input
            name="batch_year"
            type="number"
            min={2000}
            max={2100}
            required
            defaultValue={initial.batch_year ?? new Date().getFullYear()}
            className="border rounded px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Phone"
            defaultValue={initial.phone ?? ""}
            className="border rounded px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue={initial.email ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="address"
            placeholder="Address"
            defaultValue={initial.address ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="guardian_phone"
            placeholder="Guardian phone"
            defaultValue={initial.guardian_phone ?? ""}
            className="border rounded px-3 py-2"
          />
          <input name="dob" type="date" defaultValue={initial.dob ?? ""} className="border rounded px-3 py-2" />
          <input
            name="admission_date"
            type="date"
            defaultValue={initial.admission_date ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          {requirePassword && (
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Temp password (≥6)"
              className="border rounded px-3 py-2 col-span-2"
            />
          )}
          {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">
              Cancel
            </button>
            <button disabled={pending} className="px-4 py-1.5 bg-amber-600 text-white rounded disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STUDENT_COLS = ["enrollment_no", "name", "father_name", "branch", "semester", "batch_year", "email", "phone"];

function downloadSampleXlsx() {
  const wb = XLSX.utils.book_new();
  const data: any[][] = [
    [...STUDENT_COLS],
    ["CE2301", "Ram Kumar", "Sham Lal", "civil", 1, 2025, "ram@example.com", "9999999999"],
    ["ME2302", "Sita Devi", "Mohan Lal", "mechanical", 1, 2025, "sita@example.com", "9888888888"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "students_sample.xlsx");
}

function ImportTab() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<any[]>([]);
  const [csv, setCsv] = useState("");
  const [pw, setPw] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const m = useMutation({
    mutationFn: (d: any) => clerkBulkImportStudents({ data: d }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
    },
  });

  function parseCsv(text: string): any[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const head = lines[0].split(",").map((s) => s.trim());
    return lines.slice(1).map((l) => {
      const cells = l.split(",").map((c) => c.trim());
      const row: any = {};
      head.forEach((h, i) => (row[h] = cells[i] ?? ""));
      if (row.semester) row.semester = Number(row.semester);
      if (row.batch_year) row.batch_year = Number(row.batch_year);
      return row;
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    const cleaned = json
      .map((r) => ({
        enrollment_no: String(r.enrollment_no ?? "").trim(),
        name: String(r.name ?? "").trim(),
        father_name: String(r.father_name ?? "").trim() || undefined,
        branch: String(r.branch ?? "")
          .trim()
          .toLowerCase(),
        semester: Number(r.semester),
        batch_year: Number(r.batch_year),
        email: String(r.email ?? "").trim() || undefined,
        phone: String(r.phone ?? "").trim() || undefined,
      }))
      .filter((r) => r.enrollment_no && r.name);
    setRows(cleaned);
    setCsv("");
  }

  function applyCsv() {
    setRows(parseCsv(csv));
    setFileName("pasted CSV");
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadSampleXlsx}
          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download Sample.xlsx
        </button>
        <span className="text-xs text-muted-foreground">
          Required: <code>enrollment_no, name, branch, semester, batch_year</code>. Optional:{" "}
          <code>father_name, email, phone</code>.
        </span>
      </div>

      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block text-sm font-semibold">Option A — Upload Excel (.xlsx / .xls / .csv)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="text-sm" />
        {fileName && (
          <p className="text-xs text-muted-foreground">
            Loaded <b>{fileName}</b> — {rows.length} rows parsed.
          </p>
        )}
      </div>

      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block text-sm font-semibold">Option B — Paste CSV</label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder="enrollment_no,name,branch,semester,batch_year,email,phone&#10;CE2301,Ram Kumar,civil,1,2025,ram@x.com,9999999999"
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
        <button onClick={applyCsv} disabled={!csv} className="text-sm border px-3 py-1.5 rounded disabled:opacity-50">
          Parse CSV
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          minLength={6}
          placeholder="Default password for all"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <button
          disabled={!rows.length || !pw || m.isPending}
          onClick={() => m.mutate({ defaultPassword: pw, rows })}
          className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" /> Import {rows.length} rows
        </button>
      </div>
      {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
      {result && (
        <div className="bg-white border rounded p-3 text-sm">
          <p>
            <b>{result.inserted}</b> imported, <b>{result.failed.length}</b> failed.
          </p>
          {result.failed.length > 0 && (
            <ul className="text-xs mt-2 list-disc pl-5">
              {result.failed.slice(0, 20).map((f: any, i: number) => (
                <li key={i}>
                  {f.enrollment_no}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PromoteTab() {
  const [branch, setBranch] = useState("civil");
  const [from, setFrom] = useState(1);
  const m = useMutation({ mutationFn: (d: any) => clerkPromoteStudents({ data: d }) });
  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-muted-foreground">
        Move every active student in (branch + semester) to the next semester. Use once per semester rollover.
      </p>
      <div className="bg-white border rounded p-4 space-y-3">
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm bg-white"
        >
          {["civil", "mechanical", "applied_science"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={from}
          onChange={(e) => setFrom(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 text-sm bg-white"
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              Sem {s} → Sem {s + 1}
            </option>
          ))}
        </select>
        <button
          disabled={m.isPending}
          onClick={() => {
            if (confirm(`Promote ${branch} Sem ${from} → ${from + 1}?`)) m.mutate({ branch, fromSemester: from });
          }}
          className="w-full bg-amber-600 text-white py-2 rounded text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <ArrowUpCircle className="w-4 h-4" /> {m.isPending ? "Promoting…" : "Promote"}
        </button>
        {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
        {m.isSuccess && <p className="text-xs text-green-700">{(m.data as any).promoted} students promoted.</p>}
      </div>
    </div>
  );
}

function SalaryTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [adding, setAdding] = useState(false);

  const staffQ = useQuery({ queryKey: ["salary-staff"], queryFn: () => salaryStaffList() });
  const listQ = useQuery({
    queryKey: ["salary-list", month, year],
    queryFn: () => salaryList({ data: { month, year } }),
  });
  const upsert = useMutation({
    mutationFn: (d: any) => salaryUpsert({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-list"] });
      setAdding(false);
    },
  });
  const del = useMutation({
    mutationFn: (d: any) => salaryDelete({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-list"] }),
  });

  const total = useMemo(
    () => (listQ.data ?? []).reduce((s: number, r: any) => s + Number(r.net_pay || 0), 0),
    [listQ.data],
  );

  const exportXlsx = () => {
    const rows = (listQ.data ?? []).map((r: any) => ({
      Staff: r.staff_users?.username,
      Role: r.staff_users?.role,
      Dept: r.staff_users?.department,
      Month: r.month,
      Year: r.year,
      Basic: r.basic,
      DA: r.da,
      HRA: r.hra,
      "Other Allow": r.other_allow,
      Deductions: r.deductions,
      "Net Pay": r.net_pay,
      "Paid On": r.paid_on,
      Remarks: r.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Salary ${month}-${year}`);
    XLSX.writeFile(wb, `salary_${year}_${String(month).padStart(2, "0")}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2000}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-2 text-sm w-24"
        />
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-600 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Salary Entry
        </button>
        <button
          onClick={exportXlsx}
          disabled={!listQ.data?.length}
          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <span className="ml-auto text-sm">
          Total Net: <b>₹{total.toLocaleString("en-IN")}</b>
        </span>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Staff</th>
              <th className="px-3 py-2 text-right">Basic</th>
              <th className="px-3 py-2 text-right">DA</th>
              <th className="px-3 py-2 text-right">HRA</th>
              <th className="px-3 py-2 text-right">Other</th>
              <th className="px-3 py-2 text-right">Deduct</th>
              <th className="px-3 py-2 text-right">Net</th>
              <th className="px-3 py-2 text-left">Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <b>{r.staff_users?.username}</b>
                  <div className="text-xs text-muted-foreground">{r.staff_users?.role}</div>
                </td>
                <td className="px-3 py-2 text-right">{Number(r.basic).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.da).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.hra).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.other_allow).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right text-rose-700">{Number(r.deductions).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right font-semibold">{Number(r.net_pay).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-xs">{r.paid_on ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => {
                      if (confirm("Delete this salary entry?")) del.mutate({ id: r.id });
                    }}
                    className="p-1.5 hover:bg-secondary rounded text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(listQ.data ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-6 text-muted-foreground">
                  No salary entries for {month}/{year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setAdding(false)}
        >
          <div className="bg-white rounded-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[color:var(--navy)] mb-3">
              Add / Update Salary — {month}/{year}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                upsert.mutate({
                  staff_id: Number(f.get("staff_id")),
                  month,
                  year,
                  basic: Number(f.get("basic") || 0),
                  da: Number(f.get("da") || 0),
                  hra: Number(f.get("hra") || 0),
                  other_allow: Number(f.get("other_allow") || 0),
                  deductions: Number(f.get("deductions") || 0),
                  remarks: String(f.get("remarks") || "") || null,
                  paid_on: String(f.get("paid_on") || "") || null,
                });
              }}
              className="grid grid-cols-2 gap-2 text-sm"
            >
              <select name="staff_id" required className="col-span-2 border rounded px-3 py-2 bg-white">
                <option value="">— Select staff —</option>
                {(staffQ.data ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.role}
                    {s.department ? `, ${s.department}` : ""})
                  </option>
                ))}
              </select>
              <label className="text-xs">
                Basic
                <input
                  name="basic"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                DA
                <input
                  name="da"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                HRA
                <input
                  name="hra"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                Other Allowances
                <input
                  name="other_allow"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs col-span-2">
                Deductions
                <input
                  name="deductions"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                Paid On
                <input name="paid_on" type="date" className="w-full border rounded px-2 py-1.5" />
              </label>
              <label className="text-xs col-span-2">
                Remarks
                <input name="remarks" className="w-full border rounded px-2 py-1.5" />
              </label>
              {upsert.error && <p className="col-span-2 text-xs text-destructive">{upsert.error.message}</p>}
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button
                  disabled={upsert.isPending}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded disabled:opacity-50"
                >
                  {upsert.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
