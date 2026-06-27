import { createFileRoute } from "@tanstack/react-router";
import { portalMeta } from "@/components/portal/PortalShell";
import { PdfDocsPage } from "@/components/admin/PdfDocsPage";

export const Route = createFileRoute("/admin/syllabus")({
  head: () => portalMeta("Syllabus"),
  component: () => (
    <PdfDocsPage docType="syllabus" title="Syllabus" subtitle="Upload, list and download syllabus PDFs." />
  ),
});
