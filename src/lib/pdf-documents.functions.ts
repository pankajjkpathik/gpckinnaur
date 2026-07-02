import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireStaff } from "./roles.server";

const DOC_TYPES = ["calendar", "syllabus", "lesson_plan", "exam_schedule"] as const;

export const pdfDocList = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ doc_type: z.enum(DOC_TYPES) }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("pdf_documents")
      .select("id, doc_type, title, branch, semester, file_name, created_at")
      .eq("doc_type", data.doc_type)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const pdfDocUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      doc_type: z.enum(DOC_TYPES),
      title: z.string().min(2).max(200),
      branch: z.string().max(50).optional().nullable(),
      semester: z.number().int().min(1).max(8).optional().nullable(),
      file_name: z.string().min(1).max(200),
      file_b64: z.string().min(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pdf_documents").insert({
      doc_type: data.doc_type,
      title: data.title,
      branch: data.branch || null,
      semester: data.semester ?? null,
      file_name: data.file_name,
      file_b64: data.file_b64,
      uploaded_by: me.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pdfDocDownload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error } = await supabaseAdmin
      .from("pdf_documents")
      .select("title, file_name, file_b64")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !doc) throw new Error("Document not found");
    return { file_name: doc.file_name, file_b64: doc.file_b64, title: doc.title };
  });

export const pdfDocDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pdf_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
