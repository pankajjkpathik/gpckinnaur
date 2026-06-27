import { createFileRoute } from "@tanstack/react-router";
import { portalMeta } from "@/components/portal/PortalShell";
import { PdfDocsPage } from "@/components/admin/PdfDocsPage";

export const Route = createFileRoute("/admin/calendar")({
  head: () => portalMeta("Academic Calendar"),
  component: () => (
    <PdfDocsPage
      docType="calendar"
      title="Academic Calendar"
      subtitle="Upload, list and download academic calendar PDFs."
    />
  ),
});
