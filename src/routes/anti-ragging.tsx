import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { ExternalLink } from "lucide-react";
import hpAct from "@/assets/HPAntiraggingAct2009.pdf.asset.json";
import aicteRules from "@/assets/anti-ragging-aicte.pdf.asset.json";
import arc from "@/assets/ARC.pdf.asset.json";
import ars from "@/assets/ARS.pdf.asset.json";

export const Route = createFileRoute("/anti-ragging")({
  head: () => pageMeta({
    title: "Anti-Ragging — GP Kinnaur",
    description: "Anti-ragging information, legal definition, prohibited acts, helpline and committee details for Government Polytechnic, Kinnaur.",
    path: "/anti-ragging",
  }),
  component: AntiRagging,
});

const forcedActs = [
  "Chores for seniors e.g. copying notes, cleaning rooms, etc.",
  "Missing classes. Not being allowed to study.",
  "Staying awake late or getting up at unreasonable times.",
  "Singing or dancing or performing in any other way.",
  "Using foul language or shouting or cheering loudly.",
  "Misbehaving with strangers, particularly women.",
  "Reading or browsing porno-graphic/objectionable material.",
];

const constitutes = [
  "Any conduct by any student or students whether by words spoken or written or by an act which has the effect of teasing, treating or handling with rudeness a fresher or any other student;",
  "Indulging in rowdy or undisciplined activities by any student or students which causes or is likely to cause annoyance, hardship, physical or psychological harm or to raise fear or apprehension thereof in any fresher or any other student;",
  "Asking any student to do any act which such student will not in the ordinary course do and which has the effect of causing or generating a sense of shame, or torment or embarrassment so as to adversely affect the physique or psyche of such fresher or any other student;",
  "Any act by a senior student that prevents, disrupts or disturbs the regular academic activity of any other student or a fresher;",
  "Exploiting the services of a fresher or any other student for completing the academic tasks assigned to an individual or a group of students.",
  "Any act of financial extortion or forceful expenditure burden put on a fresher or any other student by students;",
  "Any act of physical abuse including all variants of it: sexual abuse, homosexual assaults, stripping, forcing obscene and lewd acts, gestures, causing bodily harm or any other danger to health or person;",
  "Any act or abuse by spoken words, emails, posts, public insults which would also include deriving perverted pleasure, vicarious or sadistic thrill from actively or passively participating in the discomfiture to fresher or any other student;",
  "Any act that affects the mental health and self-confidence of a fresher or any other student with or without an intent to derive a sadistic pleasure or showing off power, authority or superiority by a student over any fresher or any other student.",
];

function AntiRagging() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Anti-Ragging" }]} />
      <PageHeader title="Anti-Ragging" />
      <div className="container mx-auto px-4 py-10">
        <article className="bg-white border rounded-lg p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-[color:var(--navy)] uppercase tracking-wide">Anti Ragging Information</h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Ragging, inside/outside the institution, is an offence. As per the Himachal Pradesh Educational
            Institution (Prohibition of Ragging) Act 2009, every offence under this Act shall be cognizable,
            non-bailable and compoundable with the permission of court. If any student is found indulging in
            ragging activities directly or indirectly, strict action will be taken against him/her as per law.
          </p>

          <div>
            <h3 className="font-semibold text-[color:var(--navy)]">The legal definition of ragging is as follows:</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              "Ragging" means the doing of any act which causes, or is likely to cause any physical, psychological
              or physiological harm of apprehension or shame or Embarrassment to a student and includes:
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Teasing or abusing of playing Practical joke on or causing hurt to any student.</li>
              <li>Asking any student to do any act, or perform anything, which he/she would not, in the ordinary course, be willing to do or perform.</li>
            </ol>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Ragging is different from other crimes because the motive is solely to get perverse pleasure. Ragging
            is also different from other crimes as it is actively promoted by certain sections of the society.
            Following types of abuses and activities will be termed as ragging:
          </p>

          <ul className="text-sm text-muted-foreground space-y-2 pl-1">
            <li><strong className="text-foreground">Physical abuse:</strong> for example, forcing to eat, drinks or smoke, forcing to dress or undress.</li>
            <li><strong className="text-foreground">Verbal abuse:</strong> for example swear words and phrases, direct or indirect derogatory references to the person's appearance, attire, religion, caste, family or chosen field of study.</li>
            <li>
              <strong className="text-foreground">Forced activity:</strong> for example.
              <ol className="list-[lower-alpha] list-inside ml-4 mt-1 space-y-1">
                {forcedActs.map((a) => <li key={a}>{a}</li>)}
              </ol>
            </li>
          </ul>

          <div>
            <h3 className="font-semibold text-[color:var(--navy)]">Ragging also constitutes one or more of any of the following acts:</h3>
            <ul className="text-sm text-muted-foreground space-y-2 mt-2 list-disc list-inside">
              {constitutes.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[color:var(--navy)] mb-2">Important Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="text-[color:var(--navy)] hover:underline inline-flex items-center gap-1" href="https://www.aicte-india.org/" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /> Anti - Ragging rules (AICTE)</a></li>
              <li><a className="text-[color:var(--navy)] underline inline-flex items-center gap-1" href="https://techedu.hp.gov.in/" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /> Himachal Pradesh Prohibition of Ragging Act 2009</a></li>
              <li><Link className="text-[color:var(--navy)] hover:underline inline-flex items-center gap-1" to="/staff/committees"><ExternalLink className="w-3.5 h-3.5" /> Anti-Ragging Committee</Link></li>
              <li><Link className="text-[color:var(--navy)] hover:underline inline-flex items-center gap-1" to="/staff/committees"><ExternalLink className="w-3.5 h-3.5" /> Anti-Ragging Squad</Link></li>
            </ul>
          </div>
        </article>
      </div>
    </PageLayout>
  );
}
