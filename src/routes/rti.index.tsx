import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { Scale, FileText, User, Clock, AlertCircle, Download } from "lucide-react";
import rtiActPdf from "@/assets/rti-act.pdf.asset.json";
import mdRtiPdf from "@/assets/MD-RTI.pdf.asset.json";

export const Route = createFileRoute("/rti/")({
  head: () => pageMeta({
    title: "Right to Information (RTI) — GP Kinnaur",
    description: "RTI Act 2005 details, Public Information Officer, fee structure, and appeal process for Government Polytechnic, Kinnaur.",
    path: "/rti",
  }),
  component: RtiHome,
});

const steps = [
  { t: "Write an Application", d: "Write your RTI application in English or Hindi on plain paper. Clearly mention the information you require." },
  { t: "Pay the Fee", d: "Attach application fee of ₹10 via IPO, DD, or cash. BPL card holders are exempted from fee (attach BPL card copy)." },
  { t: "Submit Application", d: "Submit your application to the Public Information Officer (PIO) of the institute by post or in person." },
  { t: "Receive Information", d: "Information will be provided within 30 days. Additional fee may be charged for documents/photocopies." },
];

function RtiHome() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "RTI" }]} />
      <PageHeader title="Right to Information (RTI)" />
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-[color:var(--navy)]" />
              <h2 className="text-xl font-bold text-[color:var(--navy)]">About RTI Act, 2005</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Right to Information Act, 2005 is an Act of the Parliament of India to provide for setting out
              the practical regime of right to information for citizens to secure access to information under the
              control of public authorities, in order to promote transparency and accountability in the working of
              every public authority.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Government Polytechnic, Kinnaur, being a public authority, is committed to providing information to
              citizens as per the provisions of the RTI Act, 2005.
            </p>
            <a
              href={rtiActPdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-[color:var(--navy)] text-white hover:opacity-90"
            >
              <Download className="w-4 h-4" /> Download RTI Act, 2005 (PDF)
            </a>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] mb-4 border-b-2 border-[color:var(--gold)] inline-block pb-1">
              How to File RTI Application
            </h2>
            <ol className="space-y-4 mt-2">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-[color:var(--navy)]">{s.t}</p>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] mb-3 border-b-2 border-[color:var(--gold)] inline-block pb-1">First Appeal</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you are not satisfied with the decision of the PIO, or if you have not received the information
              within 30 days, you can file a First Appeal to the First Appellate Authority within 30 days from the
              date of decision/expiry of time limit.
            </p>
            <div className="mt-4 bg-secondary/50 border rounded-md p-4">
              <p className="font-semibold text-[color:var(--navy)]">First Appellate Authority</p>
              <p className="text-sm text-muted-foreground">Director, Department of Technical Education</p>
              <p className="text-sm text-muted-foreground">Himachal Pradesh, Sundernagar</p>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] mb-3 border-b-2 border-[color:var(--gold)] inline-block pb-1">Second Appeal</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you are still not satisfied with the decision of the First Appellate Authority, you can file a
              Second Appeal to the State Information Commission within 90 days.
            </p>
            <div className="mt-4 bg-secondary/50 border rounded-md p-4">
              <p className="font-semibold text-[color:var(--navy)]">State Information Commission</p>
              <p className="text-sm text-muted-foreground">Himachal Pradesh State Information Commission</p>
              <p className="text-sm text-muted-foreground">Block No. 10, SDA Complex, Kasumpti</p>
              <p className="text-sm text-muted-foreground">Shimla — 171009</p>
              <p className="text-sm text-muted-foreground">Website: hpic.nic.in</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Public Information Officer (PIO)</h3>
            </div>
            <dl className="text-sm space-y-2">
              <div><dt className="font-semibold">Designation</dt><dd className="text-muted-foreground">Principal</dd></div>
              <div><dt className="font-semibold">Address</dt><dd className="text-muted-foreground">Government Polytechnic, Kinnaur<br/>Camp at GP, Rohru<br/>Distt. Shimla (HP) — 171207</dd></div>
              <div><dt className="font-semibold">Phone</dt><dd className="text-muted-foreground">01781-240102</dd></div>
              <div><dt className="font-semibold">Email</dt><dd className="text-muted-foreground">gpckinnaur@rediffmail.com</dd></div>
            </dl>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">RTI Fee Structure</h3>
            </div>
            <dl className="text-sm divide-y">
              <div className="flex justify-between py-2"><dt>Application Fee</dt><dd className="font-semibold">₹ 10</dd></div>
              <div className="flex justify-between py-2"><dt>Per Page (A4)</dt><dd className="font-semibold">₹ 2</dd></div>
              <div className="flex justify-between py-2"><dt>Larger Paper</dt><dd className="font-semibold">Actual Cost</dd></div>
              <div className="flex justify-between py-2"><dt>CD/Floppy</dt><dd className="font-semibold">₹ 50</dd></div>
            </dl>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Time Limits</h3>
            </div>
            <dl className="text-sm divide-y">
              <div className="flex justify-between py-2"><dt>Normal Cases</dt><dd className="font-semibold">30 Days</dd></div>
              <div className="flex justify-between py-2"><dt>Life &amp; Liberty Cases</dt><dd className="font-semibold">48 Hours</dd></div>
              <div className="flex justify-between py-2"><dt>First Appeal</dt><dd className="font-semibold">30 Days</dd></div>
              <div className="flex justify-between py-2"><dt>Second Appeal</dt><dd className="font-semibold">90 Days</dd></div>
            </dl>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">Note</h3>
            </div>
            <p className="text-sm text-amber-900/80">
              BPL (Below Poverty Line) card holders are exempted from paying any fee. Please attach a copy of your
              BPL card with the application.
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-[color:var(--navy)]" />
              <h3 className="font-bold text-[color:var(--navy)]">Important Documents</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={rtiActPdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[color:var(--navy)] hover:underline">
                  <Download className="w-4 h-4" /> RTI Act, 2005 (PDF)
                </a>
              </li>
              <li>
                <a href={mdRtiPdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[color:var(--navy)] hover:underline">
                  <Download className="w-4 h-4" /> Mandatory Disclosure under RTI (PDF)
                </a>
              </li>
            </ul>
          </div>

          <Link to="/rti/suo-motu" className="block text-center bg-[color:var(--navy)] text-white rounded-lg p-4 font-semibold hover:opacity-90">
            View Suo Motu Disclosure →
          </Link>
        </aside>
      </div>
    </PageLayout>
  );
}
