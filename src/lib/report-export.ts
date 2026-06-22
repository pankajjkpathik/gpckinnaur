// Client-side report export helpers (PDF via jsPDF, Excel via xlsx).
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportExcel(filename: string, sheetName: string, header: string[], rows: (string | number | null)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows.map((r) => r.map((v) => (v == null ? "" : v)))]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportPDF(filename: string, title: string, subtitle: string, header: string[], rows: (string | number | null)[][]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 40, 58);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 75,
    head: [header],
    body: rows.map((r) => r.map((v) => (v == null ? "" : String(v)))),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: 40, right: 40 },
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function exportCSV(filename: string, header: string[], rows: (string | number | null)[][]) {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ExportColumn = { key: string; label: string };
export function exportRows(opts: {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  format: "pdf" | "xlsx" | "csv";
}) {
  const header = opts.columns.map((c) => c.label);
  const rows = opts.rows.map((r) => opts.columns.map((c) => (r[c.key] ?? "") as string | number));
  if (opts.format === "pdf") return exportPDF(opts.filename, opts.title || opts.filename, "", header, rows);
  if (opts.format === "xlsx") return exportExcel(opts.filename, "Report", header, rows);
  return exportCSV(opts.filename, header, rows);
}
