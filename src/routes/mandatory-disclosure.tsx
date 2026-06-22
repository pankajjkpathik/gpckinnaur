import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import pdfAsset from "@/assets/MD-RTI.pdf.asset.json";

export const Route = createFileRoute("/mandatory-disclosure")({
  head: () => pageMeta({
    title: "Disclosure under Section 4(1)B — GP Kinnaur",
    description: "Disclosure under Section 4(1)B of RTI Act, 2005 for Government Polytechnic, Kinnaur.",
    path: "/mandatory-disclosure",
  }),
  component: MandatoryDisclosure,
});

function MandatoryDisclosure() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "RTI" }, { label: "Disclosure under Section 4(1)B" }]} />
      <PageHeader title="Disclosure under Section 4(1)B of RTI Act, 2005" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-secondary/40">
            <p className="text-sm font-medium text-[color:var(--navy)]">Mandatory Disclosure under Section 4(1)B of RTI Act, 2005</p>
            <a
              href={pdfAsset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded-md bg-[color:var(--navy)] text-white"
            >
              Download PDF
            </a>
          </div>
          <iframe src={pdfAsset.url} title="Disclosure under Section 4(1)B of RTI Act, 2005" className="w-full h-[80vh]" />
        </div>
      </div>
    </PageLayout>
  );
}
