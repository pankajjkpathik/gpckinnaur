import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/grievance")({
  head: () => pageMeta({
    title: "Student Grievance — GP Kinnaur",
    description: "Submit a student grievance to Government Polytechnic, Kinnaur. Your concerns are addressed confidentially and promptly.",
    path: "/grievance",
  }),
  component: Grievance,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Invalid phone").max(20),
  subject: z.string().trim().min(3, "Subject is required").max(150),
  details: z.string().trim().min(10, "Please describe in detail").max(2000),
});

function Grievance() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setStatus("error");
      setErr(parsed.error.issues[0]?.message || "Please fix the highlighted fields.");
      return;
    }
    setStatus("ok");
    (e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Student Grievance" }]} />
      <PageHeader title="Student Grievance" />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 text-center">
          We are committed to providing a safe, fair, and harmonious learning environment. If you have any
          grievances, please fill out the form below. Your concerns will be addressed confidentially and promptly.
        </p>

        {status === "ok" && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-4 text-sm">
            Thank you. Your grievance has been recorded and will be addressed shortly.
          </div>
        )}

        <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-5">
          <Field label="Full Name" name="name" placeholder="Enter your full name" />
          <Field label="Email Address" name="email" type="email" placeholder="Enter your email address" />
          <Field label="Phone Number" name="phone" placeholder="Enter your phone number" />
          <Field label="Subject" name="subject" placeholder="Enter the subject of your grievance" />
          <div>
            <label className="text-sm font-semibold text-[color:var(--navy)]">Grievance Details</label>
            <textarea
              name="details"
              rows={6}
              placeholder="Describe your grievance in detail"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          {err && status === "error" && <p className="text-sm text-destructive">{err}</p>}
          <button className="px-6 py-3 bg-[color:var(--navy)] text-white rounded-md font-semibold">
            Submit Grievance
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[color:var(--navy)]">{label}</label>
      <input name={name} type={type} placeholder={placeholder} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
    </div>
  );
}
