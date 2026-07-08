import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Briefcase, Crown, Users, GraduationCap, ClipboardList } from "lucide-react";
import { staffLogin, staffMe } from "@/lib/auth.functions";
import { adminPortalRoles } from "@/lib/roles";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/staff-login")({
  head: () => ({ meta: [
    { title: "Staff Login — GP Kinnaur" },
    { name: "description", content: "Sign in to the GP Kinnaur staff portal — Principal, HOD, Faculty, TPO and Clerk access." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: StaffLoginPage,
});

type RoleTab = "principal" | "hod" | "faculty" | "tpo" | "clerk";

const tabs: { id: RoleTab; label: string; icon: any; hint: string }[] = [
  { id: "principal", label: "Principal", icon: Crown, hint: "Institute-wide leadership" },
  { id: "hod", label: "HOD", icon: Briefcase, hint: "Department head" },
  { id: "faculty", label: "Faculty", icon: GraduationCap, hint: "Teaching staff" },
  { id: "tpo", label: "TPO", icon: Users, hint: "Training & Placement Officer" },
  { id: "clerk", label: "Clerk", icon: ClipboardList, hint: "Office / clerical staff" },
];


function StaffLoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<RoleTab>("faculty");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    staffMe().then((s) => {
      if (!s?.id) return;
      if (adminPortalRoles.includes(s.role as any)) window.location.href = "/admin";
      else navigate({ to: "/staff-dashboard" });
    }).catch(() => {});
  }, [navigate]);

  const m = useMutation({
    mutationFn: (d: { username: string; password: string }) =>
      staffLogin({ data: { ...d, allowedRoles: [role] } }),
    onSuccess: () => (window.location.href = role === "clerk" ? "/clerk" : "/staff-dashboard"),
    onError: (e: any) => setErr(e?.message?.includes("not permitted")
      ? `This account is not a ${role.toUpperCase()} user. Pick the correct tab.`
      : "Invalid username or password"),
  });


  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    m.mutate({ username: String(fd.get("username")), password: String(fd.get("password")) });
  }

  const current = tabs.find((t) => t.id === role)!;

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white border rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logoAsset.url} alt="GP Kinnaur logo" className="w-12 h-12 object-contain" />
          <div>
            <p className="font-bold text-[color:var(--navy)]">GP Kinnaur</p>
            <p className="text-xs text-muted-foreground">Government Polytechnic, Kinnaur</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[color:var(--navy)]">Staff Portal Login</h1>
        <p className="text-sm text-muted-foreground mb-5">Select your role and sign in.</p>

        <div className="grid grid-cols-5 gap-2 mb-5" role="tablist">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = role === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => { setRole(t.id); setErr(null); }}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-md border text-xs font-medium transition ${active ? "bg-[color:var(--navy)] text-white border-[color:var(--navy)] shadow-sm" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon className="w-5 h-5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">{current.hint}</p>

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
            {m.isPending ? "Signing in…" : `Login as ${current.label}`}
          </button>
        </form>
        <Link to="/" className="block mt-6 text-center text-sm text-muted-foreground hover:text-[color:var(--navy)]">← Back to Website</Link>
      </div>
    </div>
  );
}
