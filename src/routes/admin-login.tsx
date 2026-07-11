import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { staffLogin, staffMe } from "@/lib/auth.functions";
import { adminPortalRoles } from "@/lib/roles";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [
    { title: "Admin Login — GP Kinnaur" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const landingFor = (role: string) => (role === "clerk" ? "/clerk" : "/admin");

  useEffect(() => {
    staffMe().then((s) => {
      if (s?.id && adminPortalRoles.includes(s.role as any)) {
        window.location.href = landingFor(s.role as string);
      }
    }).catch(() => {});
  }, []);

  const m = useMutation({
    mutationFn: (d: { username: string; password: string }) =>
      staffLogin({ data: { ...d, allowedRoles: adminPortalRoles as unknown as string[] } }),
    onSuccess: (s: any) => (window.location.href = landingFor(s?.role as string)),
    onError: (e: any) => setErr(e?.message?.includes("not permitted")
      ? "Only Super-Admin, Principal, HOD, and Clerk accounts can sign in here."
      : "Invalid username or password"),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    m.mutate({ username: String(fd.get("username")), password: String(fd.get("password")) });
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logoAsset.url} alt="GP Kinnaur logo" className="w-12 h-12 object-contain" />
          <div>
            <p className="font-bold text-[color:var(--navy)]">GP Kinnaur</p>
            <p className="text-xs text-muted-foreground">Restricted Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
          <ShieldCheck className="w-4 h-4" /> Admin / Clerk Login
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          For Admin, Super-Admin and Clerk accounts only. This page is not linked publicly.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium">Username</label>
            <input name="username" required className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
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
          <button disabled={m.isPending} className="w-full bg-slate-800 text-white py-2.5 rounded-md font-semibold disabled:opacity-50">
            {m.isPending ? "Signing in…" : "Enter Admin Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
