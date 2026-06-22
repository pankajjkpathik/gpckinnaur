import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/student-portal")({
  head: () => pageMeta({
    title: "Student Portal — GP Kinnaur",
    description: "Student resources at GP Kinnaur: study materials, notices, downloadable forms and quick links to academic services.",
    path: "/student-portal",
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const [tab, setTab] = useState(0);
  const tabs = ["Study Material", "Syllabus", "Previous Papers", "Important Forms"];

  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Student Portal" }]} />
      <div className="bg-gradient-to-r from-[color:var(--navy)] to-[color:var(--navy-dark)] text-white">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-white">Student Resources</h1>
          <p className="text-white/80 mt-2">Access study materials, notices and important information</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/student-login" className="px-5 py-2.5 rounded-md bg-[color:var(--student)] text-white font-semibold">Student Login →</Link>
            <a href="#notices" className="px-5 py-2.5 rounded-md border border-white/40 text-white">Notice Board</a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="border-b flex flex-wrap gap-1">
            {tabs.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === i ? "border-[color:var(--gold)] text-[color:var(--navy)]" : "border-transparent text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-6">
            {tab === 0 && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <p className="text-sm">Login to access department-specific study materials uploaded by your faculty.</p>
                <Link to="/student-login" className="inline-block mt-4 px-5 py-2 bg-[color:var(--student)] text-white rounded-md font-semibold">Login to Download →</Link>
              </div>
            )}
            {tab === 1 && (
              <div className="grid sm:grid-cols-2 gap-3">
                <a href="#" className="bg-white border rounded-lg p-4 hover:border-[color:var(--gold)]"><p className="font-semibold">Civil Engineering Syllabus</p><p className="text-xs text-muted-foreground">HPTSB · 6 Semesters</p></a>
                <a href="#" className="bg-white border rounded-lg p-4 hover:border-[color:var(--gold)]"><p className="font-semibold">Mechanical Engineering Syllabus</p><p className="text-xs text-muted-foreground">HPTSB · 6 Semesters</p></a>
              </div>
            )}
            {tab === 2 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white border rounded-lg p-4">
                    <p className="font-semibold">Previous Year Paper {n}</p>
                    <p className="text-xs text-muted-foreground">Placeholder</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 3 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {["Leave Application Form", "Bonafide Certificate Request", "Fee Receipt Request"].map((n) => (
                  <div key={n} className="bg-white border rounded-lg p-4">
                    <p className="font-semibold">{n}</p>
                    <p className="text-xs text-muted-foreground">Download PDF</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside id="notices" className="space-y-4">
          <NoticeBoard limit={6} />
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-bold text-[color:var(--navy)] mb-2">Quick Links</h3>
            <ul className="text-sm space-y-1">
              <li><Link to="/admissions" className="text-sky-700 hover:underline">Admissions</Link></li>
              <li><Link to="/anti-ragging" className="text-sky-700 hover:underline">Anti-Ragging Helpline</Link></li>
              <li><Link to="/contact" className="text-sky-700 hover:underline">Contact Office</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
