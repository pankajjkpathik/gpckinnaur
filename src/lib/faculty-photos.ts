import pankajpathik from "@/assets/faculty/pankajpathik.png.asset.json";
import amonika from "@/assets/faculty/amonika.jpg.asset.json";
import ravinder from "@/assets/faculty/ravinder.jpg.asset.json";
import surya from "@/assets/faculty/surya.jpg.asset.json";
import pankajc from "@/assets/faculty/pankajc.jpg.asset.json";
import rohit from "@/assets/faculty/rohit.jpg.asset.json";
import akshay from "@/assets/faculty/akshay.jpg.asset.json";
import manoj from "@/assets/faculty/manoj.jpg.asset.json";
import punit from "@/assets/faculty/punit.jpg.asset.json";

// Match by lower-cased substring of the faculty's full name
const MAP: { match: string; url: string }[] = [
  { match: "pathik", url: pankajpathik.url },
  { match: "amonika", url: amonika.url },
  { match: "ravinder", url: ravinder.url },
  { match: "surya", url: surya.url },
  { match: "chatanta", url: pankajc.url },
  { match: "rohit", url: rohit.url },
  { match: "akshay", url: akshay.url },
  { match: "manoj", url: manoj.url },
  { match: "punit", url: punit.url },
];

export function facultyPhoto(name?: string | null): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  return MAP.find((m) => n.includes(m.match))?.url ?? null;
}
