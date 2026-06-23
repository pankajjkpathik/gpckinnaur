import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { staffMe, studentMe } from "@/lib/auth.functions";
import MessagesTab from "@/components/portal/MessagesTab";
import { portalMeta } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/messages")({
  head: () => portalMeta("Messages"),
  component: MessagesPage,
});

function MessagesPage() {
  const nav = useNavigate();
  const staff = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe(), retry: false });
  const student = useQuery({ queryKey: ["student-me"], queryFn: () => studentMe(), retry: false, enabled: staff.isFetched && !staff.data });

  useEffect(() => {
    if (staff.isFetched && !staff.data && student.isFetched && !student.data) {
      nav({ to: "/staff-login" });
    }
  }, [staff.isFetched, staff.data, student.isFetched, student.data, nav]);

  const me = staff.data || student.data;
  if (!me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;
  const backTo = staff.data ? "/staff-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <Link to={backTo} className="text-xs text-white/70 inline-flex items-center gap-1 hover:text-white">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
            <h1 className="text-lg font-bold mt-0.5 inline-flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Messages</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <MessagesTab allowBroadcast={!!staff.data} />
      </main>
    </div>
  );
}
