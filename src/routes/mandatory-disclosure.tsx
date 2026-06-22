import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import pdfAsset from "@/assets/MD-RTI.pdf.asset.json";

export const Route = createFileRoute("/mandatory-disclosure")({
  head: () => pageMeta({
    title: "Mandatory Disclosure — GP Kinnaur",
    description: "Mandatory disclosure of Government Polytechnic, Kinnaur in compliance with CWP No. 8789/2014 & CWP No. 8781/2014.",
    path: "/mandatory-disclosure",
  }),
  component: MandatoryDisclosure,
});

function MandatoryDisclosure() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Mandatory Disclosure" }]} />
      <PageHeader title="Mandatory Disclosure" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
            <p className="text-sm font-medium text-[color:var(--navy)]">Mandatory disclosure in compliance with CWP No. 8789/2014 &amp; CWP No. 8781/2014</p>
            <a
              href={pdfAsset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-[color:var(--navy)] text-white"
            >
              Download PDF
            </a>
          </div>
          <iframe src={pdfAsset.url} title="Mandatory Disclosure" className="w-full h-[80vh]" />
        </div>
      </div>
    </PageLayout>
  );
}
