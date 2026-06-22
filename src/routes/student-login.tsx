import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { studentLogin, studentMe } from "@/lib/auth.functions";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/student-login")({
  head: () => ({ meta: [
    { title: "Student Login — GP Kinnaur" },
    { name: "description", content: "Sign in to the GP Kinnaur student portal to access notices, study materials and academic resources." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    studentMe().then((s) => { if (s?.id) navigate({ to: "/student-dashboard" }); }).catch(() => {});
  }, [navigate]);

  const m = useMutation({
    mutationFn: (d: { enrollmentNo: string; password: string }) => studentLogin({ data: d }),
    onSuccess: () => (window.location.href = "/student-dashboard"),
    onError: () => setErr("Invalid enrollment number or password"),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    m.mutate({ enrollmentNo: String(fd.get("enrollmentNo")), password: String(fd.get("password")) });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logoAsset.url} alt="GP Kinnaur logo" className="w-12 h-12 object-contain" />
          <div>
            <p className="font-bold text-[color:var(--student)]">GP Kinnaur</p>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[color:var(--student)]">Student Portal Login</h1>
        <p className="text-sm text-muted-foreground mb-6">Government Polytechnic, Kinnaur</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium">Enrollment Number</label>
            <input name="enrollmentNo" required placeholder="e.g. 2023CS001" className="mt-1 w-full border rounded-md px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label className="text-xs font-medium">Password</label>
            <div className="relative mt-1">
              <input name="password" required type={show ? "text" : "password"} className="w-full border rounded-md px-3 py-2 text-sm pr-10" />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={m.isPending} className="w-full bg-[color:var(--student)] text-white py-2.5 rounded-md font-semibold disabled:opacity-50">
            {m.isPending ? "Signing in…" : "Login"}
          </button>
        </form>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>Default password: <code>gpk@&#123;your batch year&#125;</code></p>
          <p>Contact office to reset your password.</p>
        </div>
        <Link to="/" className="block mt-6 text-center text-sm text-muted-foreground hover:text-[color:var(--student)]">← Back to Website</Link>
      </div>
    </div>
  );
}
