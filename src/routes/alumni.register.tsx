import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { registerAlumni } from "@/lib/submissions.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/alumni/register")({
  head: () => pageMeta({
    title: "Alumni Registration — GP Kinnaur",
    description: "Register as an alumnus of Government Polytechnic, Kinnaur to stay connected, receive updates and contribute to mentoring current students.",
    path: "/alumni/register",
  }),
  component: AlumniRegister,
});

function AlumniRegister() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (data: any) => registerAlumni({ data }),
    onSuccess: (_d, vars) => setSubmitted(vars.name),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      name: fd.get("name"),
      fatherName: fd.get("fatherName"),
      branch: fd.get("branch"),
      batchYear: Number(fd.get("batchYear")),
      dateOfBirth: fd.get("dateOfBirth"),
      profileType: fd.get("profileType"),
      designationSector: fd.get("designationSector"),
      salaryPackage: fd.get("salaryPackage") || "",
      phone: fd.get("phone"),
      email: fd.get("email"),
      presentAddress: fd.get("presentAddress"),
    });
  }

  if (submitted) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl">✓</div>
          <h1 className="text-2xl font-bold text-[color:var(--navy)] mt-4">Thank you, {submitted}!</h1>
          <p className="text-muted-foreground mt-2">Your registration has been submitted successfully.</p>
          <Link to="/" className="inline-block mt-6 px-5 py-2 bg-[color:var(--navy)] text-white rounded-md font-semibold">Back to Home →</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Alumni" }, { label: "Register" }]} />
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-[color:var(--navy)]">Alumni Registration</h1>
          <p className="text-sm text-muted-foreground mb-6">Stay connected with Government Polytechnic, Kinnaur</p>
          <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name" name="name" required />
            <Field label="Father's Name" name="fatherName" required />
            <Select label="Branch" name="branch" required options={["Civil Engineering", "Mechanical Engineering"]} />
            <Field label="Batch Year" name="batchYear" type="number" min={2013} required />
            <Field label="Date of Birth" name="dateOfBirth" type="date" required />
            <Select label="Professional Profile" name="profileType" required options={["Govt Job", "Private Job", "Self Employed", "Higher Studies", "Other"]} />
            <Field label="Designation / Sector" name="designationSector" required />
            <Field label="Salary Package (optional)" name="salaryPackage" placeholder="e.g. 3-5 LPA" />
            <Field label="Contact Number" name="phone" type="tel" required />
            <Field label="Email ID" name="email" type="email" required />
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Present Address *</label>
              <textarea name="presentAddress" required rows={3} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            {mutation.isError && <p className="sm:col-span-2 text-sm text-destructive">Failed to submit. Please check your inputs.</p>}
            <button type="submit" disabled={mutation.isPending} className="sm:col-span-2 bg-[color:var(--navy)] text-white py-3 rounded-md font-semibold disabled:opacity-50">
              {mutation.isPending ? "Submitting…" : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

function Field(p: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = p;
  return (
    <div>
      <label className="text-xs font-medium">{label}{p.required && " *"}</label>
      <input {...rest} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
    </div>
  );
}
function Select({ label, options, ...rest }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-xs font-medium">{label}{rest.required && " *"}</label>
      <select {...rest} className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white">
        <option value="">Select…</option>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}
