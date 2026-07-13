// PDF generators for Industrial Training letter and per-student Undertakings.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/logo.png.asset.json";

const INSTITUTE = "GOVERNMENT POLYTECHNIC, KINNAUR";
const INSTITUTE_ADDRESS = "Camp at GP Rohru, Distt. Shimla (H.P.)";
const INSTITUTE_PHONE = "Phone: 01786-222206";

type TrainingRecord = {
  id: number;
  training_type: string;
  branch?: string | null;
  semester?: number | null;
  student_names?: string[] | null;
  company?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

let _logoCache: string | null = null;
async function loadLogo(): Promise<string | null> {
  if (_logoCache) return _logoCache;
  try {
    const res = await fetch(logoAsset.url);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    _logoCache = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
}

function letterhead(doc: jsPDF, logo: string | null) {
  const w = doc.internal.pageSize.getWidth();
  if (logo) {
    try { doc.addImage(logo, "PNG", 40, 30, 60, 60); } catch { /* ignore */ }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("OFFICE OF THE PRINCIPAL", w / 2, 50, { align: "center" });
  doc.setFontSize(13);
  doc.text(INSTITUTE, w / 2, 68, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(INSTITUTE_ADDRESS, w / 2, 84, { align: "center" });
  doc.text(INSTITUTE_PHONE, w / 2, 98, { align: "center" });
  doc.setLineWidth(0.8);
  doc.line(40, 108, w - 40, 108);
}

function fmtDate(iso?: string | null) {
  if (!iso) return "____________";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function ordinal(n: number | null | undefined) {
  if (!n) return "";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export type PdfBuild = { blob: Blob; filename: string; url: string };

export async function generateTrainingLetter(r: TrainingRecord): Promise<PdfBuild> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 50;
  const logo = await loadLogo();
  letterhead(doc, logo);

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  doc.setFontSize(10);
  doc.text(`No. GPCK/TPO/${r.id}`, margin, 132);
  doc.text(`Dated: ${today}`, w - margin, 132, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let y = 160;
  doc.text("To,", margin, y); y += 16;
  doc.setFont("helvetica", "bold");
  doc.text("The Training Head / Manager,", margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  const company = r.company || "____________________________________";
  const wrappedCo = doc.splitTextToSize(company, w - 2 * margin);
  doc.text(wrappedCo, margin, y); y += wrappedCo.length * 14 + 10;

  doc.setFont("helvetica", "bold");
  const sem = r.semester ? `${ordinal(r.semester)} semester` : "";
  const branchTxt = r.branch ? `${r.branch.charAt(0).toUpperCase()}${r.branch.slice(1)} Engineering` : "Engineering";
  doc.text(`Subject: Industrial Training of ${sem} students of ${branchTxt}.`, margin, y, { maxWidth: w - 2 * margin });
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.text("Dear Sir/Madam,", margin, y); y += 18;

  const body =
    `As you are aware, this Institute imparts three years Diploma programmes to the students of H.P. & neighbouring states. In order to give a more competitive edge to the students, the Govt. of H.P., Department of Technical Education has made Industrial Training compulsory. The duration of this ${r.training_type || "training"} will be a structured programme during vacations. Our faculty will keep liaison with the concerned Industry/Organisation. You will appreciate that this training exposes the students to the industrial culture, ethics & work environment and helps them see the state-of-the-art technology of the modern industry.\n\n` +
    `Your esteemed organisation has been extending co-operation to this Institute from time to time. I take this opportunity to request you to accept the students listed below for training ` +
    (r.start_date ? `w.e.f. ${fmtDate(r.start_date)}${r.end_date ? ` to ${fmtDate(r.end_date)}` : ""}.` : `during the ensuing vacations.`) +
    ` You are requested to conduct this training preferably free of cost.`;
  const bodyLines = doc.splitTextToSize(body, w - 2 * margin);
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 14 + 8;

  const names = (r.student_names ?? []).filter(Boolean);
  if (names.length) {
    autoTable(doc, {
      startY: y,
      head: [["Sr. No.", "Name of Student"]],
      body: names.map((n, i) => [String(i + 1), n]),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [123, 31, 76] },
      margin: { left: margin, right: margin },
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  if (y > 680) { doc.addPage(); y = 80; }
  doc.text("Thanking you,", margin, y); y += 18;
  doc.text("Yours faithfully,", margin, y); y += 60;
  doc.setFont("helvetica", "bold");
  doc.text("Principal", w - margin, y, { align: "right" }); y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(INSTITUTE, w - margin, y, { align: "right" }); y += 24;
  doc.setFontSize(10);
  doc.text(`Copy to: H.O.D. ${branchTxt}, GPC Kinnaur (H.P.)`, margin, y);

  const filename = `Training-Letter-${(r.company || "company").replace(/[^\w]+/g, "_")}-${r.id}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename, url: URL.createObjectURL(blob) };
}

function undertakingPage(
  doc: jsPDF,
  title: string,
  paragraph: string,
  points: string[],
  signatureLabel: string,
  logo: string | null,
) {
  const w = doc.internal.pageSize.getWidth();
  const margin = 60;
  letterhead(doc, logo);
  let y = 140;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, w / 2, y, { align: "center" });
  // underline
  const tw = doc.getTextWidth(title);
  doc.line(w / 2 - tw / 2, y + 2, w / 2 + tw / 2, y + 2);
  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(paragraph, w - 2 * margin);
  doc.text(lines, margin, y);
  y += lines.length * 16 + 10;

  doc.text("I understand that:", margin, y); y += 18;
  points.forEach((p, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${p}`, w - 2 * margin - 12);
    doc.text(wrapped, margin + 12, y);
    y += wrapped.length * 15 + 4;
  });

  y += 40;
  doc.text("Date: _______________", margin, y);
  doc.text(signatureLabel, w - margin, y, { align: "right" });
}

export async function generateUndertakings(r: TrainingRecord): Promise<PdfBuild> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const logo = await loadLogo();
  const names = (r.student_names ?? []).filter(Boolean);
  const sem = r.semester ? `${ordinal(r.semester)} semester` : "____ semester";
  const branchTxt = r.branch ? `${r.branch.charAt(0).toUpperCase()}${r.branch.slice(1)} Engineering` : "Engineering";
  const period =
    r.start_date
      ? `w.e.f. ${fmtDate(r.start_date)}${r.end_date ? ` to ${fmtDate(r.end_date)}` : ""}`
      : "w.e.f. ____________ to ____________";
  const company = r.company || "____________________________________";

  const list = names.length ? names : ["______________________________"];

  list.forEach((name, idx) => {
    if (idx > 0) doc.addPage();

    // ── Student Undertaking ─────────────────────────────
    undertakingPage(
      doc,
      "Undertaking",
      `I, ${name}, student of ${sem} ${branchTxt} Department of ${INSTITUTE}, am going for industrial training (${r.training_type || "Industrial Training"}) ${period} at ${company}.`,
      [
        "The above said training will be at my own risk and I will be responsible for any damage caused to the industry due to my negligence.",
        "As the training is part of the curriculum and is entirely on my own will, if I join a training organization where a fee is charged for the same, I will not claim any reimbursement of training money paid, if any, and it will be purely at my own expenditure. I will also not claim any TA/DA for the training.",
      ],
      "Signature of Student",
      logo,
    );

    // ── Parent Undertaking ──────────────────────────────
    doc.addPage();
    undertakingPage(
      doc,
      "Undertaking by Parent",
      `I, ____________________________, Father/Mother of ${name}, student of ${sem} ${branchTxt} Department of ${INSTITUTE}. My child is going for industrial training (${r.training_type || "Industrial Training"}) ${period} at ${company}.`,
      [
        "The above said training will be at my child's own risk and I will be responsible for any damage caused to the industry due to my child's negligence.",
        "As the training is part of the curriculum and is entirely on our will, if my child joins a training organization where a fee is charged for the same, I or my child will not claim any reimbursement of training money paid, if any, and it will be purely on our own expenditure. My child will also not claim any TA/DA for the training.",
      ],
      "Signature of Parent",
      logo,
    );
  });

  doc.save(`Undertakings-${(r.company || "training").replace(/[^\w]+/g, "_")}-${r.id}.pdf`);
}
