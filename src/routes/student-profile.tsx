import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { studentMe } from "@/lib/auth.functions";
import { avatarUrl, displayName, initialsOf } from "@/lib/portal-identity";

export const Route = createFileRoute("/student-profile")({
  head: () => ({ meta: [{ title: "My Profile — Student Portal" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StudentProfile,
});

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">{k}</span>
      <span className="text-sm text-slate-800 font-medium text-right break-words">{v || "—"}</span>
    </div>
  );
}

function StudentProfile() {
  const fn = useServerFn(studentMe);
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["student-me-profile"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/student-login" });
  }, [isLoading, me, navigate]);

  if (!me) return null;
  const m: any = me;
  const fullName = displayName({ name: m.name, username: m.enrollment_no } as any);
  const photo = avatarUrl({ name: m.name, image_url: m.image_url } as any);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <strong className="text-sm">Student Portal · My Profile</strong>
          </div>
          <Link to="/student-dashboard" className="text-xs px-3 py-1.5 bg-white/15 border border-white/30 rounded hover:bg-white/25">← Back to Dashboard</Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border shadow-sm flex items-center gap-6">
          {photo ? (
            <img src={photo} alt={fullName} className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
              {initialsOf(m.name || m.enrollment_no)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-emerald-900 tracking-wide uppercase break-words">{fullName}</h1>
            <p className="text-sm text-slate-600 mt-1">Enrollment No: <strong>{m.enrollment_no}</strong></p>
            <p className="text-xs text-slate-500 mt-1">{m.branch} · Semester {m.semester} · Batch {m.batch_year}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h2 className="text-sm font-bold text-emerald-900 mb-3">Academic</h2>
            <Row k="Enrollment No" v={m.enrollment_no} />
            <Row k="Branch" v={m.branch} />
            <Row k="Semester" v={m.semester} />
            <Row k="Batch Year" v={m.batch_year} />
            <Row k="Member Since" v={m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"} />
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h2 className="text-sm font-bold text-emerald-900 mb-3">Personal & Contact</h2>
            <Row k="Father's Name" v={m.father_name} />
            <Row k="Phone" v={m.phone} />
            <Row k="Email" v={m.email} />
          </div>
        </div>
      </div>
    </main>
  );
}
