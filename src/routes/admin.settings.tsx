import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import {
  getInstituteAddress,
  setInstituteAddress,
  getInstituteLogo,
  setInstituteLogo,
} from "@/lib/settings.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => portalMeta("Institute Settings"),
  component: SettingsPage,
});

const MAX_LOGO_BYTES = 500 * 1024; // 500 KB — keeps PDF generation snappy

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function SettingsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const addrQ = useQuery({
    queryKey: ["institute-address"],
    queryFn: () => getInstituteAddress(),
    enabled: !!me,
  });

  const logoQ = useQuery({
    queryKey: ["institute-logo"],
    queryFn: () => getInstituteLogo(),
    enabled: !!me,
  });

  const [address, setAddress] = useState("");
  useEffect(() => {
    if (addrQ.data?.value != null) setAddress(addrQ.data.value);
  }, [addrQ.data?.value]);

  const save = useMutation({
    mutationFn: (value: string) => setInstituteAddress({ data: { value } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute-address"] }),
  });

  const saveLogo = useMutation({
    mutationFn: (value: string) => setInstituteLogo({ data: { value } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute-logo"] }),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const onPickLogo = async (file: File | null) => {
    setLogoError(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      setLogoError("Use a PNG, JPEG, WEBP or SVG image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`Image is too large (${(file.size / 1024).toFixed(0)} KB). Max 500 KB.`);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    saveLogo.mutate(dataUrl);
  };

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const currentLogo = logoQ.data?.value || "";

  return (
    <PortalShell title="Institute Settings" subtitle="Admin · System Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Address */}
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#7b1f4c] text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Institute Address</h1>
              <p className="text-xs text-gray-500">
                Shown in the header of Industrial Training Letter and Undertaking PDFs.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Address (single line)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="e.g., Camp at GP Rohru, Distt. Shimla (H.P.)"
              className="border rounded w-full px-3 py-2 text-sm"
              disabled={addrQ.isLoading}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Keep it short — this renders as one centered line under the institute name.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => save.mutate(address.trim())}
              disabled={save.isPending || !address.trim() || address.trim() === (addrQ.data?.value ?? "")}
              className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {save.isPending ? "Saving…" : "Save Address"}
            </button>
            {save.isSuccess && !save.isPending && (
              <span className="text-xs text-emerald-700">Saved.</span>
            )}
            {save.error && (
              <span className="text-xs text-rose-700">{(save.error as Error).message}</span>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#7b1f4c] text-white flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Institute Logo</h1>
              <p className="text-xs text-gray-500">
                Appears at the top-left of every Training Letter and Undertaking PDF.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-24 h-24 border rounded flex items-center justify-center bg-gray-50 overflow-hidden">
              {currentLogo ? (
                <img src={currentLogo} alt="Institute logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-[11px] text-gray-400 text-center px-2">Using bundled default</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={saveLogo.isPending}
                  className="bg-[#7b1f4c] text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {saveLogo.isPending ? "Uploading…" : currentLogo ? "Replace Logo" : "Upload Logo"}
                </button>
                {currentLogo && (
                  <button
                    onClick={() => { if (confirm("Revert to default bundled logo?")) saveLogo.mutate(""); }}
                    disabled={saveLogo.isPending}
                    className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                )}
                {saveLogo.isSuccess && !saveLogo.isPending && (
                  <span className="text-xs text-emerald-700">Saved.</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                PNG, JPEG, WEBP or SVG. Max 500 KB. Square images render best at 60×60 pt in the letterhead.
              </p>
              {logoError && <p className="text-xs text-rose-700">{logoError}</p>}
              {saveLogo.error && (
                <p className="text-xs text-rose-700">{(saveLogo.error as Error).message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
