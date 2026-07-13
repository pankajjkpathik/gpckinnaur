import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffMe, staffChangePassword, staffLogout } from "@/lib/auth.functions";
import { checkPasswordStrength, firstPasswordStrengthError } from "@/lib/password-strength";

export const Route = createFileRoute("/staff-change-password")({
  head: () => ({ meta: [{ title: "Change Password — Staff" }, { name: "description", content: "Change Password — Staff at Government Polytechnic, Kinnaur — internal portal page." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  useEffect(() => { if (!isLoading && !me) navigate({ to: "/staff-login" }); }, [me, isLoading, navigate]);

  const m = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => staffChangePassword({ data: d }),
    onSuccess: async () => {
      setMsg({ kind: "ok", text: "Password updated. Signing you out…" });
      try { await staffLogout(); } catch { /* ignore */ }
      qc.clear();
      setTimeout(() => navigate({ to: "/staff-login" }), 1200);
    },
    onError: (e: any) => setMsg({ kind: "err", text: e.message || "Failed to update" }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const checks = checkPasswordStrength(pw, current);

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-[color:var(--navy)] mb-1">Change Password</h1>
        <p className="text-sm text-muted-foreground mb-6">Signed in as <b>{me.username}</b></p>
        <form onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          if (pw !== pw2) { setMsg({ kind: "err", text: "Passwords do not match" }); return; }
          const err = firstPasswordStrengthError(pw, current);
          if (err) { setMsg({ kind: "err", text: err }); return; }
          m.mutate({ currentPassword: current, newPassword: pw });
        }} className="space-y-3">
          <input value={current} onChange={(e) => setCurrent(e.target.value)} type="password" required placeholder="Current password" className="w-full border rounded px-3 py-2 text-sm" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required placeholder="New password" className="w-full border rounded px-3 py-2 text-sm" />
          <input value={pw2} onChange={(e) => setPw2(e.target.value)} type="password" required placeholder="Confirm new password" className="w-full border rounded px-3 py-2 text-sm" />
          <ul className="text-xs space-y-1 bg-secondary/40 rounded p-2">
            {checks.map((c) => (
              <li key={c.key} className={c.ok ? "text-green-700" : "text-muted-foreground"}>
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
          {msg && <p className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-destructive"}`}>{msg.text}</p>}
          <button disabled={m.isPending} className="w-full bg-[color:var(--navy)] text-white py-2.5 rounded font-semibold disabled:opacity-50">
            {m.isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
        <Link to="/staff-dashboard" className="block mt-6 text-center text-sm text-muted-foreground hover:text-[color:var(--navy)]">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
