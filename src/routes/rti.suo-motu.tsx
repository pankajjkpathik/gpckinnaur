import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/rti/suo-motu")({
  head: () => pageMeta({
    title: "Suo Motu Disclosure — GP Kinnaur",
    description: "Suo motu disclosure of more items under Section 4 of RTI Act, 2005 for Government Polytechnic, Kinnaur.",
    path: "/rti/suo-motu",
  }),
  component: SuoMotu,
});

const rows: { num: string; title: string; sub?: string; info: React.ReactNode }[] = [
  {
    num: "1.1",
    title: "Information related to procurement",
    sub: "Information pertaining to procurement, Goods and Services with value exceeding Rs. 10 Lakh each",
    info: (
      <ul className="space-y-1">
        <li>a) Purchases: Machinery and Equipment: Nil</li>
        <li>b) Procurement of Stationery and Furniture: Nil</li>
        <li>c) Procurement of Computers: Nil</li>
        <li>d) Housekeeping Services: Nil</li>
        <li>e) Security Services: Nil</li>
      </ul>
    ),
  },
  { num: "1.2", title: "Public Private Partnerships", sub: "Information on PPP", info: "Not Applicable" },
  {
    num: "1.3",
    title: "Transfer Policy and Transfer Orders",
    sub: "As per the process and procedures.",
    info: (
      <span>
        Transfer orders are available at the website of Directorate of Technical Education Vocational &amp; Industrial Training, Sundernagar, H.P. (
        <a className="text-[color:var(--navy)] underline" href="https://techedu.hp.gov.in/?q=notification" target="_blank" rel="noopener noreferrer">
          https://techedu.hp.gov.in/?q=notification
        </a>
        )
      </span>
    ),
  },
  {
    num: "1.4",
    title: "RTI Applications received",
    info: (
      <div>
        <p>RTI Application Received: <strong>04</strong></p>
        <p>RTI Application disposed: <strong>03</strong></p>
      </div>
    ),
  },
  { num: "1.5", title: "CAG and PAC paras", sub: "CAG and PAC paras of Govt. Polytechnic Kinnaur", info: "NIL" },
  {
    num: "1.6",
    title: "Citizen Charter",
    sub: "Details of the training facilities available to the candidates",
    info: "viz Admission Procedure, Courses available, Course Fee, Admission Prospectus, examination details, results etc have been made available on the institute website and Himachal Pradesh Takniki Shiksha Board, Dharamshala website.",
  },
  { num: "1.7", title: "Discretionary and Non-discretionary grants", info: "Not Applicable" },
  { num: "1.8", title: "Foreign and Domestic tours", info: "Nil" },
];

function SuoMotu() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "RTI" }, { label: "Suo Motu Disclosure" }]} />
      <PageHeader title="Suo Motu Disclosure of More Items" />
      <div className="container mx-auto px-4 py-10">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-bold text-[color:var(--navy)] mb-4">
            Suo motu disclosure of more items under Section 4 of RTI Act, 2005
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-3 py-3 w-12">Sr. No.</th>
                  <th className="px-3 py-3 w-1/3">Information to be disclosed under Section 4 of RTI Act, 2005.</th>
                  <th className="px-3 py-3">Information pertaining to Govt. Polytechnic, Kinnaur</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={r.num} className="align-top">
                    <td className="px-3 py-4">{i + 1}</td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-[color:var(--navy)]">{r.num} {r.title}</p>
                      {r.sub && <p className="text-muted-foreground text-xs mt-1">{r.sub}</p>}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{r.info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
