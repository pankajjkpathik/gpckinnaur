import { useRef, useState } from "react";
import { Upload, Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

type ImportResult = { inserted?: number; deleted?: number; errors?: { row: number; error: string }[] };

export function BulkOpsBar({
  sample,
  sampleName,
  onImport,
  selectedCount = 0,
  onBulkDelete,
  importLabel = "Bulk Upload",
}: {
  sample: any[];
  sampleName: string;
  onImport?: (rows: any[]) => Promise<ImportResult> | ImportResult;
  selectedCount?: number;
  onBulkDelete?: () => Promise<void> | void;
  importLabel?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${sampleName}.xlsx`);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !onImport) return;
    setMsg(null); setErr(null); setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      if (rows.length === 0) { setErr("Empty sheet"); return; }
      const r = await onImport(rows);
      const errs = r.errors ?? [];
      setMsg(`✓ ${r.inserted ?? 0} imported${errs.length ? ` · ${errs.length} errors (row ${errs.slice(0,3).map(e=>e.row).join(", ")}${errs.length>3?"…":""})` : ""}`);
    } catch (ex: any) {
      setErr(ex?.message ?? "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doDelete = async () => {
    if (!onBulkDelete) return;
    if (!confirm(`Delete ${selectedCount} selected row(s)?`)) return;
    setDelBusy(true); setErr(null); setMsg(null);
    try {
      await onBulkDelete();
      setMsg(`✓ ${selectedCount} deleted`);
    } catch (ex: any) {
      setErr(ex?.message ?? "Delete failed");
    } finally { setDelBusy(false); }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" onClick={downloadSample} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-1">
        <Download className="w-4 h-4" /> Sample.xlsx
      </button>
      {onImport && (
        <>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="px-3 py-2 bg-emerald-700 text-white rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {busy ? "Importing…" : importLabel}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
        </>
      )}
      {onBulkDelete && (
        <button type="button" onClick={doDelete} disabled={delBusy || selectedCount === 0} className="px-3 py-2 bg-rose-700 text-white rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40">
          <Trash2 className="w-4 h-4" /> {delBusy ? "Deleting…" : `Delete Selected (${selectedCount})`}
        </button>
      )}
      {err && <span className="text-xs text-destructive">{err}</span>}
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
