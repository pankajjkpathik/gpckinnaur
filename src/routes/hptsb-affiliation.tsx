import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import pdfAsset from "@/assets/HPTSB.pdf.asset.json";

export const Route = createFileRoute("/hptsb-affiliation")({
  head: () => pageMeta({
    title: "HPTSB Affiliation — GP Kinnaur",
    description: "Himachal Pradesh Takniki Shiksha Board affiliation renewal for GP Kinnaur, academic session 2025-26.",
    path: "/hptsb-affiliation",
  }),
  component: HptsbAffiliation,
});

function HptsbAffiliation() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "About" }, { label: "HPTSB Affiliation" }]} />
      <PageHeader title="HPTSB Affiliation" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
            <p className="text-sm font-medium text-[color:var(--navy)]">HP Takniki Shiksha Board Affiliation 2025-26</p>
            <a
              href={pdfAsset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-[color:var(--navy)] text-white"
            >
              Download PDF
            </a>
          </div>
          <iframe src={pdfAsset.url} title="HPTSB Affiliation" className="w-full h-[80vh]" />
        </div>
      </div>
    </PageLayout>
  );
}
