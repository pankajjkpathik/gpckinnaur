import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { submitContact } from "@/lib/submissions.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — GP Kinnaur" }, { name: "description", content: "Reach out to Government Polytechnic, Kinnaur." }] }),
  component: Contact,
});

function Contact() {
  const [done, setDone] = useState(false);
  const mutation = useMutation({
    mutationFn: (d: any) => submitContact({ data: d }),
    onSuccess: () => setDone(true),
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone") || "",
      subject: fd.get("subject"),
      message: fd.get("message"),
    });
  }

  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Contact Us" }]} />
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <InfoCard icon="📍" title="Address" lines={["Government Polytechnic, Kinnaur", "Camp at: Government Polytechnic Rohru", "Distt. Shimla, HP — 171207"]} />
          <InfoCard icon="📞" title="Phone" lines={["01781-292440"]} />
          <InfoCard icon="✉" title="Email" lines={["gpkinnaur@rediffmail.com", "gpckinnaur@gmail.com"]} />
          <InfoCard icon="🕐" title="Office Hours" lines={["Mon-Sat: 9:00 AM – 5:00 PM", "2nd Saturday & Sunday: Closed"]} />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold text-[color:var(--navy)] mb-4">Send Us a Message</h2>
            {done ? (
              <p className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded p-3 text-sm">
                Thank you! Your message has been sent. We will get back to you soon.
              </p>
            ) : (
              <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
                <Field name="name" label="Full Name" required />
                <Field name="email" type="email" label="Email" required />
                <Field name="phone" type="tel" label="Phone" />
                <div>
                  <label className="text-xs font-medium">Subject *</label>
                  <select name="subject" required className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="">Select…</option>
                    <option>General Inquiry</option>
                    <option>Admissions</option>
                    <option>Courses</option>
                    <option>Placements</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Message *</label>
                  <textarea name="message" required rows={4} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                {mutation.isError && <p className="sm:col-span-2 text-sm text-destructive">Failed to send. Try again.</p>}
                <button type="submit" disabled={mutation.isPending} className="sm:col-span-2 bg-[color:var(--navy)] text-white py-3 rounded-md font-semibold disabled:opacity-50">
                  {mutation.isPending ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
          <div className="bg-white border rounded-lg overflow-hidden">
            <iframe
              src="https://maps.google.com/maps?q=Government+Polytechnic+Rohru+Shimla&t=&z=11&ie=UTF8&iwloc=&output=embed"
              className="w-full h-72 border-0"
              loading="lazy"
              title="Map"
            />
            <p className="px-4 py-2 text-xs text-muted-foreground bg-secondary/40">* Institute operates from camp campus at GP Rohru</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function InfoCard({ icon, title, lines }: { icon: string; title: string; lines: string[] }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-start gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="font-semibold text-[color:var(--navy)]">{title}</p>
        {lines.map((l, i) => (<p key={i} className="text-sm text-muted-foreground">{l}</p>))}
      </div>
    </div>
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
