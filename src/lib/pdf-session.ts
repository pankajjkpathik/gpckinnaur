// Shared cache for active academic session info used inside PDF generators.
// Populated at runtime by the useActiveSession hook so client-side PDF
// generators (report-export, training-letter, etc.) always print the current
// session name and start date in their header.

export type PdfSessionInfo = { year: string; startDate: string };

let current: PdfSessionInfo = { year: "2026-27", startDate: "2026-08-01" };

export function setActivePdfSession(info: Partial<PdfSessionInfo>) {
  if (info.year) current.year = info.year;
  if (info.startDate) current.startDate = info.startDate;
}

export function getActivePdfSession(): PdfSessionInfo {
  return { ...current };
}

export function formatSessionStart(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function sessionHeaderLine(info: PdfSessionInfo = getActivePdfSession()): string {
  return `Session ${info.year}  •  Start: ${formatSessionStart(info.startDate)}`;
}
