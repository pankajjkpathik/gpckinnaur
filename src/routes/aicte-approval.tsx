import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import pdfAsset from "@/assets/MD-CWP.pdf.asset.json";

export const Route = createFileRoute("/aicte-approval")({
  head: () => pageMeta({
    title: "AICTE Approval — GP Kinnaur",
    description: "AICTE Extension of Approval (EoA) 2025-26 for Government Polytechnic, Kinnaur.",
    path: "/aicte-approval",
  }),
  component: AicteApproval,
});

function AicteApproval() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "About" }, { label: "AICTE Approval" }]} />
      <PageHeader title="AICTE Approval" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
            <p className="text-sm font-medium text-[color:var(--navy)]">AICTE Extension of Approval 2025-26</p>
            <a
              href={pdfAsset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-[color:var(--navy)] text-white"
            >
              Download PDF
            </a>
          </div>
          <iframe src={pdfAsset.url} title="AICTE Approval" className="w-full h-[80vh]" />
        </div>
      </div>
    </PageLayout>
  );
}
