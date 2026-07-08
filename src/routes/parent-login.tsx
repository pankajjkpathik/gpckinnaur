import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Users, ArrowLeft } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { parentLogin } from "@/lib/parent.functions";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/parent-login")({
  head: () =>
    pageMeta({
      title: "Parent Portal Login — GP Kinnaur",
      description:
        "Parent Portal login for Government Polytechnic Kinnaur. Sign in with your child's enrollment number and the password shared by your child.",
      path: "/parent-login",
    }),
  component: ParentLogin,
});

function ParentLogin() {
  const nav = useNavigate();
  const [enroll, setEnroll] = useState("");
  const [pw, setPw] = useState("");
  const login = useMutation({
    mutationFn: () => parentLogin({ data: { enrollmentNo: enroll.trim(), password: pw } }),
    onSuccess: () => nav({ to: "/parent-dashboard" }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <img src={logoAsset.url} alt="GPK" className="w-12 h-12 rounded-full bg-white p-0.5" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700 font-semibold">GP Kinnaur</p>
            <h1 className="text-xl font-bold text-gray-800">Parent Portal</h1>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg p-3 mb-5 flex gap-2">
          <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Sign in with your ward's <b>Enrollment Number</b> prefixed by <b>p-</b>
            &nbsp;(e.g. <code>p-250824009024</code>). Standard password is{" "}
            <b>Welcome@123</b>.
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">Ward Enrollment (prefix with p-)</label>
            <input
              value={enroll}
              onChange={(e) => setEnroll(e.target.value)}
              placeholder="p-250824009024"
              autoFocus
              className="border rounded-lg w-full px-3 py-2.5 text-sm tracking-wide focus:ring-2 focus:ring-emerald-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="border rounded-lg w-full px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              required
            />
          </div>
          {login.error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded px-3 py-2">
              {(login.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            {login.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-[11px] text-gray-400 text-center mt-6">
          Access is enabled by default for every active student. Use enrollment prefix <b>p-</b> and password <b>Welcome@123</b>.
        </p>

      </div>
    </div>
  );
}
