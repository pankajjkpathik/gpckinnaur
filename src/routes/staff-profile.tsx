import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { staffMe, uploadStaffAvatar } from "@/lib/auth.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { avatarUrl, displayName, initialsOf } from "@/lib/portal-identity";
import { Camera, Loader2 } from "lucide-react";

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

function readAsBase64(file: File): Promise<{ contentBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve({
        contentBase64: comma >= 0 ? result.slice(comma + 1) : result,
        contentType: file.type || "image/png",
      });
    };
    reader.readAsDataURL(file);
  });
}

function StaffProfile() {
  const fn = useServerFn(staffMe);
  const uploadFn = useServerFn(uploadStaffAvatar);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me-profile"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/staff-login" });
  }, [isLoading, me, navigate]);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
      const { contentBase64, contentType } = await readAsBase64(file);
      return uploadFn({ data: { filename: file.name, contentType, contentBase64 } });
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["staff-me-profile"] });
      qc.invalidateQueries({ queryKey: ["staff-me"] });
    },
    onError: (e: any) => setError(e?.message || "Upload failed"),
  });

  if (!me) return null;
  const m: any = me;
  const photo = avatarUrl(m);
  const fullName = displayName(m);

  return (
    <PortalShell title="My Profile" me={m as any} accent="navy">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-2xl p-6 border shadow-sm flex items-center gap-6">
          <div className="relative shrink-0">
            {photo ? (
              <img src={photo} alt={fullName} className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-slate-700 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
                {initialsOf(m.name || m.username)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-60 ring-2 ring-white"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-[color:var(--navy)] tracking-wide uppercase break-words">{fullName}</h1>
            <p className="text-sm text-slate-600 mt-1">{m.designation || m.role}</p>
            <p className="text-xs text-slate-500 mt-1">Department: <strong>{m.department || "—"}</strong></p>
            <p className="text-xs text-slate-500 mt-2">
              Click the camera to update your profile photo · PNG, JPG, WEBP or GIF · up to 5 MB
            </p>
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
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
