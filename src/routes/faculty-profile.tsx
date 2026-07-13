import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { staffMe, staffUpdateProfile, uploadStaffAvatar } from "@/lib/auth.functions";
import { hasRole, facultyRoles } from "@/lib/roles";
import { PortalShell } from "@/components/portal/PortalShell";
import { avatarUrl, displayName, initialsOf } from "@/lib/portal-identity";
import { Camera, Loader2, Save, ArrowLeft, User, Phone, Mail, MapPin, Building2, IdCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Faculty Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FacultyProfile,
});

type Form = {
  name: string;
  designation: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  ip_number: string;
  pmis_number: string;
  date_of_joining: string;
  date_of_retirement: string;
};

const EMPTY: Form = {
  name: "",
  designation: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  ip_number: "",
  pmis_number: "",
  date_of_joining: "",
  date_of_retirement: "",
};

function toDateInput(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

function Field({
  label,
  children,
  hint,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  icon?: any;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-600";

function FacultyProfile() {
  const meFn = useServerFn(staffMe);
  const updateFn = useServerFn(staffUpdateProfile);
  const uploadFn = useServerFn(uploadStaffAvatar);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ["staff-me-faculty-profile"],
    queryFn: () => meFn(),
  });

  // Guard: only faculty (and above — hod/principal/super_admin who hold faculty rights)
  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      navigate({ to: "/staff-login", replace: true });
      return;
    }
    if (!hasRole(me as any, facultyRoles)) {
      navigate({ to: "/staff-dashboard", replace: true });
    }
  }, [isLoading, me, navigate]);

  useEffect(() => {
    if (!me) return;
    const m: any = me;
    const next: Form = {
      name: m.name ?? "",
      designation: m.designation ?? "",
      dob: toDateInput(m.dob),
      phone: m.phone ?? "",
      email: m.email ?? "",
      address: m.address ?? "",
      ip_number: m.ip_number ?? "",
      pmis_number: m.pmis_number ?? "",
      date_of_joining: toDateInput(m.date_of_joining),
      date_of_retirement: toDateInput(m.date_of_retirement),
    };
    setForm(next);
    setInitial(next);
  }, [me]);

  const dirty = useMemo(
    () => (Object.keys(form) as (keyof Form)[]).some((k) => (form[k] ?? "") !== (initial[k] ?? "")),
    [form, initial],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
      if (form.phone && !/^[0-9+\-\s()]*$/.test(form.phone))
        throw new Error("Phone may only contain digits, spaces, +, -, ( or )");
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        throw new Error("Enter a valid email address");
      const patch: Partial<Form> = {};
      (Object.keys(form) as (keyof Form)[]).forEach((k) => {
        if ((form[k] ?? "") !== (initial[k] ?? "")) patch[k] = form[k];
      });
      return updateFn({ data: patch as any });
    },
    onSuccess: () => {
      setSaveMsg({ kind: "ok", text: "Profile updated successfully" });
      toast.success("Profile updated");
      setInitial(form);
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-faculty-profile"] });
    },
    onError: (e: any) => {
      const text = e?.message || "Failed to update profile";
      setSaveMsg({ kind: "err", text });
      toast.error("Could not update profile", { description: text });
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type))
        throw new Error("Please choose a PNG, JPG, WEBP or GIF image");
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
      const { contentBase64, contentType } = await readAsBase64(file);
      return uploadFn({ data: { filename: file.name, contentType, contentBase64 } });
    },
    onSuccess: () => {
      setAvatarMsg({ kind: "ok", text: "Profile photo updated" });
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-faculty-profile"] });
    },
    onError: (e: any) => {
      const text = e?.message || "Upload failed";
      setAvatarMsg({ kind: "err", text });
      toast.error("Photo upload failed", { description: text });
    },
  });

  if (isLoading || !me || !hasRole(me as any, facultyRoles)) return null;
  const m: any = me;
  const photo = avatarUrl(m);
  const fullName = displayName(m);

  return (
    <PortalShell title="My Profile" subtitle="Faculty Portal" me={m as any} accent="teal">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            to="/faculty"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty Dashboard
          </Link>
        </div>

        {/* Hero / avatar card */}
        <div className="bg-gradient-to-r from-teal-50 to-slate-50 rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            {photo ? (
              <img
                src={photo}
                alt={fullName}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-slate-700 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
                {initialsOf(m.name || m.username)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-60 ring-2 ring-white"
              title="Change profile image"
              aria-label="Change profile image"
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
                if (f) {
                  setAvatarMsg(null);
                  upload.mutate(f);
                }
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 text-center sm:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-wide uppercase break-words">
              {fullName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">{m.designation || m.role}</p>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {m.department || "—"}</span>
              <span className="inline-flex items-center gap-1"><IdCard className="w-3 h-3" /> {m.staff_id || m.username || "—"}</span>
              <span className="uppercase tracking-wide font-semibold">{m.role}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Your profile image appears across every faculty dashboard header. PNG, JPG, WEBP or GIF · up to 5 MB.
            </p>
            {avatarMsg && (
              <p
                className={`text-xs mt-2 ${
                  avatarMsg.kind === "ok" ? "text-emerald-600" : "text-rose-600"
                }`}
                role={avatarMsg.kind === "err" ? "alert" : undefined}
              >
                {avatarMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* Editable details */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaveMsg(null);
            save.mutate();
          }}
          className="mt-6 bg-white rounded-2xl border shadow-sm"
        >
          <div className="p-5 border-b">
            <h2 className="text-sm font-bold text-teal-700">Personal & Contact Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your contact information up-to-date. Username, role and department are managed by the administrator.
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" icon={User}>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Designation">
              <input
                className={inputCls}
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                maxLength={100}
                placeholder="e.g. Assistant Professor / Lecturer"
              />
            </Field>
            <Field label="Email" icon={Mail}>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                maxLength={255}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Phone" icon={Phone} hint="Digits, spaces and + - ( ) only">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                maxLength={15}
                inputMode="tel"
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                className={inputCls}
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              />
            </Field>
            <Field label="Date of joining">
              <input
                type="date"
                className={inputCls}
                value={form.date_of_joining}
                onChange={(e) => setForm((f) => ({ ...f, date_of_joining: e.target.value }))}
              />
            </Field>
            <Field label="Date of retirement">
              <input
                type="date"
                className={inputCls}
                value={form.date_of_retirement}
                onChange={(e) => setForm((f) => ({ ...f, date_of_retirement: e.target.value }))}
              />
            </Field>
            <Field label="IP number">
              <input
                className={inputCls}
                value={form.ip_number}
                onChange={(e) => setForm((f) => ({ ...f, ip_number: e.target.value }))}
                maxLength={50}
              />
            </Field>
            <Field label="PMIS number">
              <input
                className={inputCls}
                value={form.pmis_number}
                onChange={(e) => setForm((f) => ({ ...f, pmis_number: e.target.value }))}
                maxLength={50}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address" icon={MapPin}>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  maxLength={500}
                />
              </Field>
            </div>
          </div>

          <div className="px-5 py-4 border-t bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
            <div className="min-h-[1.25rem]">
              {saveMsg && (
                <p
                  className={`text-xs ${
                    saveMsg.kind === "ok" ? "text-emerald-600" : "text-rose-600"
                  }`}
                  role={saveMsg.kind === "err" ? "alert" : "status"}
                >
                  {saveMsg.text}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(initial);
                  setSaveMsg(null);
                }}
                disabled={!dirty || save.isPending}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!dirty || save.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white shadow hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {save.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </button>
            </div>
          </div>
        </form>

        {/* Read-only account block */}
        <div className="mt-6 bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="text-sm font-bold text-teal-700 mb-3">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Username</span>
              <span className="font-medium text-slate-800">{m.username || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Staff ID</span>
              <span className="font-medium text-slate-800">{m.staff_id || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Role</span>
              <span className="font-medium text-slate-800 uppercase">{m.role || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Department</span>
              <span className="font-medium text-slate-800">{m.department || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Last login</span>
              <span className="font-medium text-slate-800">
                {m.last_login ? new Date(m.last_login).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-500">Member since</span>
              <span className="font-medium text-slate-800">
                {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Need to change your password?{" "}
            <Link to="/staff-change-password" className="text-teal-700 font-medium hover:underline">
              Update password
            </Link>
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
