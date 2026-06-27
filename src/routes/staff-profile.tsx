import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { avatarUrl, displayName, initialsOf } from "@/lib/portal-identity";

export const Route = createFileRoute("/staff-profile")({
  head: () => ({ meta: [{ title: "My Profile — Staff Portal" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StaffProfile,
});

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">{k}</span>
      <span className="text-sm text-slate-800 font-medium text-right break-words">{v || "—"}</span>
    </div>
  );
}

function StaffProfile() {
  const fn = useServerFn(staffMe);
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me-profile"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/staff-login" });
  }, [isLoading, me, navigate]);

  if (!me) return null;
  const m: any = me;
  const photo = avatarUrl(m);
  const fullName = displayName(m);

  return (
    <PortalShell title="My Profile" me={m as any} accent="navy">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-2xl p-6 border shadow-sm flex items-center gap-6">
          {photo ? (
            <img src={photo} alt={fullName} className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-slate-700 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
              {initialsOf(m.name || m.username)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-[color:var(--navy)] tracking-wide uppercase break-words">{fullName}</h1>
            <p className="text-sm text-slate-600 mt-1">{m.designation || m.role}</p>
            <p className="text-xs text-slate-500 mt-1">Department: <strong>{m.department || "—"}</strong></p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[color:var(--navy)] mb-3">Account</h2>
            <Row k="Username" v={m.username} />
            <Row k="Role" v={m.role} />
            <Row k="Staff ID" v={m.staff_id} />
            <Row k="Department" v={m.department} />
            <Row k="Designation" v={m.designation} />
            <Row k="Last Login" v={m.last_login ? new Date(m.last_login).toLocaleString() : "—"} />
            <Row k="Member Since" v={m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"} />
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[color:var(--navy)] mb-3">Personal & Contact</h2>
            <Row k="Date of Birth" v={m.dob ? new Date(m.dob).toLocaleDateString() : "—"} />
            <Row k="Phone" v={m.phone} />
            <Row k="Email" v={m.email} />
            <Row k="Address" v={m.address} />
            <Row k="IP Number" v={m.ip_number} />
            <Row k="PMIS Number" v={m.pmis_number} />
            <Row k="Date of Joining" v={m.date_of_joining ? new Date(m.date_of_joining).toLocaleDateString() : "—"} />
            <Row k="Date of Retirement" v={m.date_of_retirement ? new Date(m.date_of_retirement).toLocaleDateString() : "—"} />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
