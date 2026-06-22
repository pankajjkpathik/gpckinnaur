import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { staffMe, staffChangePassword } from "@/lib/auth.functions";

export const Route = createFileRoute("/staff-change-password")({
  head: () => ({ meta: [{ title: "Change Password — Staff" }, { name: "description", content: "Change Password — Staff at Government Polytechnic, Kinnaur — internal portal page." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { if (!isLoading && !me) navigate({ to: "/staff-login" }); }, [me, isLoading, navigate]);

  const m = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => staffChangePassword({ data: d }),
    onSuccess: () => setMsg({ kind: "ok", text: "Password updated successfully." }),
    onError: (e: any) => setMsg({ kind: "err", text: e.message || "Failed to update" }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-[color:var(--navy)] mb-1">Change Password</h1>
        <p className="text-sm text-muted-foreground mb-6">Signed in as <b>{me.username}</b></p>
        <form onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const f = new FormData(e.currentTarget);
          const np = String(f.get("newPassword"));
          const cp = String(f.get("confirmPassword"));
          if (np !== cp) { setMsg({ kind: "err", text: "Passwords do not match" }); return; }
          m.mutate({ currentPassword: String(f.get("currentPassword")), newPassword: np });
          (e.currentTarget as HTMLFormElement).reset();
        }} className="space-y-3">
          <input name="currentPassword" type="password" required placeholder="Current password" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="newPassword" type="password" required minLength={8} placeholder="New password (min 8 chars)" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="confirmPassword" type="password" required placeholder="Confirm new password" className="w-full border rounded px-3 py-2 text-sm" />
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
