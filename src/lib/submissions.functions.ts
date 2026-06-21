import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { staffSessionConfig, type StaffSession } from "./sessions";

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(100),
        phone: z.string().trim().max(15).optional().or(z.literal("")),
        subject: z.string().trim().min(1).max(100),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    });
    return { success: true };
  });

export const registerAlumni = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        fatherName: z.string().trim().min(1).max(100),
        branch: z.string().min(1),
        batchYear: z.number().min(2013),
        dateOfBirth: z.string().min(1).max(20),
        profileType: z.string().min(1),
        designationSector: z.string().min(1).max(100),
        salaryPackage: z.string().max(50).optional().or(z.literal("")),
        phone: z.string().min(1).max(15),
        email: z.string().email().max(100),
        presentAddress: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("alumni_registrations").insert({
      name: data.name,
      father_name: data.fatherName,
      branch: data.branch,
      batch_year: data.batchYear,
      date_of_birth: data.dateOfBirth,
      profile_type: data.profileType,
      designation_sector: data.designationSector,
      salary_package: data.salaryPackage || null,
      phone: data.phone,
      email: data.email,
      present_address: data.presentAddress,
    });
    return { success: true };
  });

function requireInboxRole(user: Partial<StaffSession> | undefined) {
  if (!user?.id || !user.role) throw new Error("Not authenticated");
  if (!["super_admin", "principal", "admin_staff"].includes(user.role as string))
    throw new Error("Insufficient permissions");
}


export const listContactSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<StaffSession>(staffSessionConfig);
  requireInboxRole(session.data);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("contact_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });
  return data ?? [];
});

export const markContactRead = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    requireInboxRole(session.data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("contact_submissions")
      .update({ is_read: true })
      .eq("id", data.id);
    return { success: true };
  });

export const listAlumniSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<StaffSession>(staffSessionConfig);
  requireInboxRole(session.data);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("alumni_registrations")
    .select("*")
    .order("submitted_at", { ascending: false });
  return data ?? [];
});

export const verifyAlumni = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    const user = session.data;
    if (!user?.id || !user.role) throw new Error("Not authenticated");
    if (!["super_admin", "principal"].includes(user.role as string))
      throw new Error("Insufficient permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("alumni_registrations")
      .update({ is_verified: true })
      .eq("id", data.id);
    return { success: true };
  });

export const submissionCounts = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<StaffSession>(staffSessionConfig);
  if (!session.data?.id) throw new Error("Not authenticated");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [c1, c2, c3, c4] = await Promise.all([
    supabaseAdmin
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
    supabaseAdmin
      .from("alumni_registrations")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", false),
    supabaseAdmin.from("notices").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("study_materials").select("*", { count: "exact", head: true }),
  ]);
  return {
    unreadContact: c1.count ?? 0,
    unverifiedAlumni: c2.count ?? 0,
    totalNotices: c3.count ?? 0,
    totalMaterials: c4.count ?? 0,
  };
});
