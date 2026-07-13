import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Building2 } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import { getInstituteAddress, setInstituteAddress } from "@/lib/settings.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => portalMeta("Institute Settings"),
  component: SettingsPage,
});

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

  const [address, setAddress] = useState("");
  useEffect(() => {
    if (addrQ.data?.value != null) setAddress(addrQ.data.value);
  }, [addrQ.data?.value]);

  const save = useMutation({
    mutationFn: (value: string) => setInstituteAddress({ data: { value } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute-address"] }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Institute Settings" subtitle="Admin · System Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
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
      </div>
    </PortalShell>
  );
}
