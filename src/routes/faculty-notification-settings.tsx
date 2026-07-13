import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, Megaphone, AlarmClock, CalendarClock, Zap, Eye, MousePointerClick } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { useFacNotifPrefs, type FacNotifPrefs } from "@/lib/faculty-notif-prefs";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-notification-settings")({
  head: () => portalMeta("Notification Settings"),
  component: FacultyNotifSettings,
});

function FacultyNotifSettings() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
  }, [me, isLoading, nav]);

  if (isLoading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <PortalShell
      title="Notification Settings"
      subtitle="Choose which categories appear in your notifications"
      me={me as any}
      accent="teal"
    >
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-4">
          <Link
            to="/faculty"
            className="inline-flex items-center gap-1.5 text-sm text-[#7b1f4c] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Faculty Portal
          </Link>
        </div>
        <SettingsCard userId={(me as any).id} />
      </div>
    </PortalShell>
  );
}

function SettingsCard({ userId }: { userId: string | number }) {
  const { prefs, update } = useFacNotifPrefs(userId);

  const toggle = (key: keyof FacNotifPrefs, label: string) => {
    const next = !prefs[key];
    update({ [key]: next });
    toast.success(`${label} ${next ? "enabled" : "disabled"}`);
  };

  const categories: {
    key: keyof FacNotifPrefs;
    label: string;
    desc: string;
    icon: any;
    tint: string;
  }[] = [
    {
      key: "announcements",
      label: "Announcements & Notices",
      desc: "Institution-wide announcements and formal notices posted by admin.",
      icon: Megaphone,
      tint: "bg-indigo-100 text-indigo-700",
    },
    {
      key: "deadlines",
      label: "Assignment Deadlines",
      desc: "Upcoming assignment due dates within the next 14 days.",
      icon: CalendarClock,
      tint: "bg-amber-100 text-amber-700",
    },
    {
      key: "overdue",
      label: "Overdue Reminders",
      desc: "Assignments whose due date has already passed (within the last 3 days).",
      icon: AlarmClock,
      tint: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-amber-50 via-white to-rose-50 flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#7b1f4c]" />
        <div>
          <p className="font-semibold text-gray-800">Notification Preferences</p>
          <p className="text-xs text-gray-500">
            Changes apply instantly and sync across all your open tabs.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-b">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Categories
        </p>
        <div className="space-y-2">
          {categories.map(({ key, label, desc, icon: Icon, tint }) => {
            const enabled = prefs[key];
            return (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  enabled ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <Switch checked={enabled} onChange={() => toggle(key, label)} />
              </label>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Delivery
        </p>
        <label
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
            prefs.toasts ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Live toast pop-ups</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Show a small pop-up in the corner when a new notification arrives in real time.
              Disabling this keeps the notifications panel updating silently.
            </p>
          </div>
          <Switch
            checked={prefs.toasts}
            onChange={() => toggle("toasts", "Live toast pop-ups")}
          />
        </label>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t text-[11px] text-gray-500">
        Preferences are stored on this device and each of your browsers separately.
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
      className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
