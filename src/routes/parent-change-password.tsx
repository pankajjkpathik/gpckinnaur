import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parentChangePassword, parentMe } from "@/lib/parent.functions";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/parent-change-password")({
  head: () => ({
    meta: [
      { title: "Change Password — Parent Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ParentChangePassword,
});

function ParentChangePassword() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["parent-me"], queryFn: () => parentMe() });
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      parentChangePassword({ data: { currentPassword: current, newPassword: pw } }),
    onSuccess: () => {
      setCurrent("");
      setPw("");
      setPw2("");
      setErr(null);
    },
    onError: (e: any) => setErr(e.message),
  });

  if (!isLoading && !me) {
    nav({ to: "/parent-login" });
    return null;
  }

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="GPK" className="w-9 h-9 rounded-full" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-700">GP Kinnaur · Parent</p>
              <p className="font-bold text-gray-800">Change Password</p>
            </div>
          </div>
          <Link to="/parent-dashboard" className="text-xs text-gray-600 border rounded px-3 py-1.5 hover:bg-gray-50">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Change Your Password</h1>
          <p className="text-xs text-gray-500 mb-5">
            The default parent password is <b className="font-mono">Welcome@123</b>. Please change it to a strong personal password.
          </p>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">Current Password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">New Password (min 6 chars)</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="border rounded w-full px-3 py-2"
                minLength={6}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="border rounded w-full px-3 py-2"
              />
            </div>
            {err && <p className="text-xs text-rose-700">{err}</p>}
            {save.isSuccess && <p className="text-xs text-emerald-700">Password updated successfully.</p>}
            <button
              onClick={() => {
                setErr(null);
                if (pw.length < 6) return setErr("New password must be at least 6 characters.");
                if (pw !== pw2) return setErr("New passwords do not match.");
                save.mutate();
              }}
              disabled={save.isPending || !current || !pw}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
