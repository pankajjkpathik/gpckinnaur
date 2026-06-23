import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { AlertCircle, CalendarDays, ClipboardList, Download, FileText, Phone, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admissions")({
  head: () =>
    pageMeta({
      title: "Admissions 2025-26 — GP Kinnaur",
      description:
        "Admission process, eligibility, important dates, fee structure and documents required for Diploma in Civil & Mechanical Engineering at GP Kinnaur.",
      path: "/admissions",
    }),
  component: Admissions,
});

const dates = [
  { l: "Polytechnic Admission Test (PAT-2026)", v: "17-05-2026 (Sunday) 10:00 A.M. to 01:00 P.M." },
  { l: "Lateral Entry Entrance Test (LEET-2026)", v: "24-05-2026 (Sunday) 10:00 A.M. to 12:00 Noon" },
  { l: "Application Start", v: "March/April 2026" },
  { l: "Last Date to Apply", v: "To be announced" },
  { l: "Merit List", v: "Results declared" },
  { l: "Counseling", v: "Dates announced" },
  { l: "Session Starts", v: "August 2026" },
];

const fees = [
  ["Tuition Fee", "₹ 3,450 / Year"],
  ["Development Fund", "₹ 3,000 / Year"],
  ["Examination Fee", "₹ 600 / Year"],
  ["Hostel Charges", "₹ 4,200 / Year"],
  ["Other Charges", "As applicable"],
];

const steps = [
  [
    "Online Registration",
    "Register on HP Takniki Shiksha Board portal and fill the application form with required details.",
  ],
  [
    "Document Upload",
    "Upload scanned copies of required documents including mark sheets, certificates, and photographs.",
  ],
  ["Fee Payment", "Pay the application fee online through the available payment methods."],
  ["Merit List Publication", "Merit list will be published based on marks obtained in the qualifying examination."],
  [
    "Counseling & Seat Allotment",
    "Attend counseling (online/offline) for seat allotment based on merit and preference.",
  ],
  [
    "Document Verification & Admission",
    "Report to the institute with original documents for verification and complete admission formalities.",
  ],
];

const docs = [
  "10th Mark Sheet & Certificate",
  "12th Mark Sheet (for Lateral Entry)",
  "ITI Certificate (for Lateral Entry)",
  "Character Certificate",
  "Migration Certificate",
  "Domicile Certificate (HP)",
  "Category Certificate (if applicable)",
  "Income Certificate",
  "Aadhaar Card",
  "Passport Size Photographs (4)",
  "Transfer Certificate",
  "Medical Fitness Certificate",
];

function Admissions() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Admission" }]} />
      <PageHeader title="Admission Process" />
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] inline-block pb-1 mb-4">
              Admission Overview
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Admission to Government Polytechnic, Kinnaur is conducted through centralized counseling by the HP Takniki
              Shiksha Board, Dharamshala. Candidates are selected based on merit in the qualifying examination.
            </p>
            <div className="mt-4 flex gap-3 bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-900">
                <strong>Admission Open:</strong> Applications for the academic session 2025-26 are now being accepted.
                Please visit the HP Takniki Shiksha Board website for online registration.
              </p>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] inline-block pb-1 mb-4">
              Eligibility Criteria
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-[color:var(--navy)] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Regular Entry (1st Year)
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Passed 10th class examination from a recognized board</li>
                  <li>Minimum 35% marks in aggregate</li>
                  <li>Must have studied Mathematics and Science</li>
                  <li>Age: Not more than 21 years as on 1st October of the admission year</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[color:var(--navy)] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Lateral Entry (2nd Year)
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Passed 10+2 examination with Physics, Chemistry &amp; Mathematics, OR</li>
                  <li>ITI certificate (2 years) in relevant trade after 10th, OR</li>
                  <li>Diploma holders seeking admission to different branch</li>
                  <li>Minimum 45% marks for general category, 40% for reserved categories</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] inline-block pb-1 mb-4">
              Admission Process
            </h2>
            <ol className="space-y-4">
              {steps.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[color:var(--navy)]">{t}</p>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] inline-block pb-1 mb-4">
              Documents Required
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {docs.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {d}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Important Dates 2025-26</h3>
            </div>
            <dl className="text-sm divide-y">
              {dates.map((d) => (
                <div key={d.l} className="py-2.5 flex justify-between gap-3">
                  <dt className="text-muted-foreground">{d.l}</dt>
                  <dd className="font-medium text-right">{d.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Fee Structure (Approx.)</h3>
            </div>
            <dl className="text-sm divide-y">
              {fees.map(([l, v]) => (
                <div key={l} className="py-2.5 flex justify-between">
                  <dt>{l}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground mt-3">
              * Fee structure may be revised as per government orders
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Downloads</h3>
            </div>
            <ul className="text-sm space-y-2">
              <li>
                <a
                  className="text-[color:var(--navy)] hover:underline"
                  href="https://www.hptechboard.com/storage/files/1/PAT_LEET_2026/PAT%202026%20Prospectus_.pdf"
                >
                  Download Prospectus Polytechnic Admission (PAT-2026)
                </a>
              </li>
              <li>
                <a className="text-[color:var(--navy)] hover:underline" href="#">
                  Application Form
                </a>
              </li>
              <li>
                <a className="text-[color:var(--navy)] hover:underline" href="#">
                  Fee Structure Details
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-[color:var(--navy)] text-white rounded-lg p-6">
            <h3 className="font-bold text-white mb-2">Admission Enquiry</h3>
            <p className="text-sm text-white/80 mb-3">For admission related queries, contact:</p>
            <p className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4" /> 01781-292440
            </p>
            <p className="flex items-center gap-2 text-sm mt-1">
              <Mail className="w-4 h-4" /> gpckinnaur@rediffmail.com
            </p>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
