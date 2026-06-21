import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { staffLogin, staffMe } from "@/lib/auth.functions";

export const Route = createFileRoute("/staff-login")({
  head: () => ({ meta: [{ title: "Staff Login — GP Kinnaur" }] }),
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    staffMe().then((s) => { if (s?.id) navigate({ to: "/staff-dashboard" }); }).catch(() => {});
  }, [navigate]);

  const m = useMutation({
    mutationFn: (d: { username: string; password: string }) => staffLogin({ data: d }),
    onSuccess: () => (window.location.href = "/staff-dashboard"),
    onError: () => setErr("Invalid username or password"),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    m.mutate({ username: String(fd.get("username")), password: String(fd.get("password")) });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold">GPK</div>
          <div>
            <p className="font-bold text-[color:var(--navy)]">GP Kinnaur</p>
            <p className="text-xs text-muted-foreground">Government Polytechnic, Kinnaur</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[color:var(--navy)]">Staff Portal Login</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to manage notices, materials and submissions.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium">Username</label>
            <input name="username" required placeholder="Enter username" className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
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
          <button disabled={m.isPending} className="w-full bg-[color:var(--navy)] text-white py-2.5 rounded-md font-semibold disabled:opacity-50">
            {m.isPending ? "Signing in…" : "Login"}
          </button>
        </form>
        <Link to="/" className="block mt-6 text-center text-sm text-muted-foreground hover:text-[color:var(--navy)]">← Back to Website</Link>
      </div>
    </div>
  );
}
