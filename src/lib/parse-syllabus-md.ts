// Parses a Markdown syllabus file into unit records for the Planned Unit Hours form.
// Recognizes headings such as:
//   ## Unit 1: Title (10 hours)
//   # UNIT-II — Title  [8 hrs]
//   Unit III: Title
// Topics are bullet lines under the heading (- / * / 1.) or comma/semicolon lists.
// A "Hours: N" / "Periods: N" line inside a unit sets its hours.

export type ParsedUnit = {
  unit_no: number;
  title: string;
  hours: number; // legacy total = lecture + practical
  lecture_hours: number;
  practical_hours: number;
  topics: string[];
};


const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
};

function toNum(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (/^\d+$/.test(t)) return Number(t);
  if (t in ROMAN) return ROMAN[t];
  return null;
}

// Match e.g. "## Unit 1: Title", "Unit-II — Title", "### UNIT 3 Title"
const UNIT_RE =
  /^\s*#{0,6}\s*unit\s*[-\s]?\s*([ivxlcdm\d]+)\s*[:.\-–—]?\s*(.*)$/i;

const HOURS_INLINE_RE =
  /[\(\[\{]\s*(\d{1,3})\s*(?:hrs?|hours?|periods?|h|p)?\s*[\)\]\}]/i;

const HOURS_LABEL_RE =
  /^\s*(?:planned\s+)?(?:hours?|hrs?|periods?)\s*[:=\-]\s*(\d{1,3})\b/i;

function stripBullet(line: string): string {
  return line
    .replace(/^\s*[-*+•]\s+/, "")
    .replace(/^\s*\d+[\.\)]\s+/, "")
    .replace(/^\s*\([a-z0-9]+\)\s+/i, "")
    .trim();
}

function splitInline(text: string): string[] {
  return text
    .split(/[,;]| and /i)
    .map((t) => t.trim())
    .filter((t) => t && t.length > 1);
}

export function parseSyllabusMarkdown(md: string): ParsedUnit[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const units: ParsedUnit[] = [];
  let cur: ParsedUnit | null = null;

  const commit = () => {
    if (!cur) return;
    // dedupe + trim topics
    const seen = new Set<string>();
    cur.topics = cur.topics
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => {
        if (!t || t.length < 2) return false;
        const k = t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    units.push(cur);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ");
    const m = line.match(UNIT_RE);
    if (m) {
      const n = toNum(m[1]);
      if (n != null) {
        commit();
        let title = (m[2] || "").trim();
        let hours = 0;
        let lecture_hours = 0;
        let practical_hours = 0;
        const h = title.match(HOURS_INLINE_RE);
        if (h) {
          hours = Number(h[1]);
          title = title.replace(HOURS_INLINE_RE, "").trim();
        }
        title = title.replace(/^[:.\-–—\s]+/, "").replace(/[:.\-–—\s]+$/, "").trim();
        cur = {
          unit_no: n,
          title: title || `Unit ${n}`,
          hours,
          lecture_hours,
          practical_hours,
          topics: [],
        };
        continue;
      }
    }
    if (!cur) continue;

    // Explicit theory / practical labels take precedence.
    const th = line.match(/^\s*(?:theory|lecture|lect)\s*[:=\-]\s*(\d{1,3})\b/i);
    if (th) {
      cur.lecture_hours = Number(th[1]);
      continue;
    }
    const pr = line.match(/^\s*(?:practical|lab|prac)\s*[:=\-]\s*(\d{1,3})\b/i);
    if (pr) {
      cur.practical_hours = Number(pr[1]);
      continue;
    }

    const hl = line.match(HOURS_LABEL_RE);
    if (hl) {
      cur.hours = Number(hl[1]);
      continue;
    }
    const hi = line.match(HOURS_INLINE_RE);
    if (hi && /hour|hr|period/i.test(line) && !cur.hours) {
      cur.hours = Number(hi[1]);
    }

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(topics?|contents?|sub[-\s]?topics?|syllabus)\s*[:\-]?\s*$/i.test(trimmed)) continue;
    if (/^[|\-:\s]+$/.test(trimmed)) continue;

    const bulletMatch = /^\s*([-*+•]|\d+[\.\)]|\([a-z0-9]+\))\s+/i.test(line);
    if (bulletMatch) {
      const t = stripBullet(line);
      if (t) cur.topics.push(...splitInline(t));
    } else {
      if (/[,;]/.test(trimmed) && trimmed.length < 300) {
        cur.topics.push(...splitInline(trimmed));
      } else if (trimmed.length < 200 && !/^#{1,6}\s/.test(trimmed)) {
        cur.topics.push(trimmed);
      }
    }
  }
  commit();

  units.sort((a, b) => a.unit_no - b.unit_no);
  // If nothing set explicit lecture/practical, treat parsed `hours` as lecture by default.
  for (const u of units) {
    if (u.lecture_hours === 0 && u.practical_hours === 0 && u.hours > 0) {
      u.lecture_hours = u.hours;
    }
    u.hours = u.lecture_hours + u.practical_hours;
  }
  return units;
}

// Rescale a numeric field (`hours`, `lecture_hours`, `practical_hours`) proportionally
// so its sum across units equals `target`.
export function rescaleField<K extends "hours" | "lecture_hours" | "practical_hours">(
  units: ParsedUnit[],
  target: number,
  field: K,
): ParsedUnit[] {
  if (target < 0 || units.length === 0) return units;
  const total = units.reduce((s, u) => s + (Number(u[field]) || 0), 0);
  if (total <= 0) {
    const base = Math.floor(target / units.length);
    const rem = target - base * units.length;
    return units.map((u, i) => ({ ...u, [field]: base + (i < rem ? 1 : 0) }));
  }
  const scaled = units.map((u) => ({
    ...u,
    __v: (Number(u[field]) * target) / total,
  }));
  const floored = scaled.map((u) => ({ ...u, [field]: Math.floor(u.__v) }));
  let diff = target - floored.reduce((s, u) => s + (u[field] as number), 0);
  const order = scaled
    .map((u, i) => ({ i, frac: u.__v - Math.floor(u.__v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && diff > 0; k++, diff--) {
    (floored[order[k].i][field] as number) += 1;
  }
  return floored.map(({ __v: _v, ...rest }) => rest as ParsedUnit);
}

// Back-compat wrapper: rescale the legacy `hours` field.
export function rescaleHours(units: ParsedUnit[], target: number): ParsedUnit[] {
  return rescaleField(units, target, "hours");
}

// Heading that introduces a practical/experiment/program list in a lab syllabus.
// Matches e.g. "List of Practicals", "## Practicals", "List of Experiments",
// "Lab Exercises", "List of Programs", "Practical List".
const PRACTICAL_SECTION_RE =
  /^\s*#{0,6}\s*(?:list\s+of\s+)?(?:practical|experiment|program|programme|lab(?:oratory)?\s+(?:exercise|experiment|work|practical))s?\s*[:\-–—]?\s*$/i;

// A section-ending heading that signals the practical list has ended.
const NEW_SECTION_RE = /^\s*#{1,6}\s+\S|^\s*unit\s*[-\s]?\s*[ivx\d]/i;

// Matches an individual practical line like:
//   "Practical 1: Identify various sizes..."
//   "Practical-2 - Undertake reciprocal ranging..."
//   "Practical 10  Apply the relevant..."
const PRACTICAL_ITEM_RE =
  /^\s*(?:\*\*)?\s*practical\s*[-\s]?\s*(\d{1,3})\s*(?:\*\*)?\s*[:.\-–—)]?\s*(.+?)\s*$/i;

// Parse a lab-syllabus Markdown that lists individual practicals/experiments
// instead of units. Each numbered / bulleted item becomes its own row so the
// admin can assign practical hours per experiment.
export function parsePracticalList(md: string): ParsedUnit[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const items: { title: string }[] = [];
  let inSection = false;
  let sawExplicitItem = false;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ");
    const trimmed = line.trim();

    // Highest-priority: explicit "Practical N ..." lines anywhere in the file.
    const pm = trimmed.match(PRACTICAL_ITEM_RE);
    if (pm) {
      const title = pm[2].replace(/\*\*/g, "").trim();
      if (title) {
        items.push({ title });
        sawExplicitItem = true;
        continue;
      }
    }

    if (!inSection) {
      if (PRACTICAL_SECTION_RE.test(trimmed)) inSection = true;
      continue;
    }
    if (!trimmed) continue;
    if (NEW_SECTION_RE.test(line) && !PRACTICAL_SECTION_RE.test(trimmed)) {
      inSection = false;
      continue;
    }
    if (/^[|\-:\s]+$/.test(trimmed)) continue;

    const isBullet = /^\s*([-*+•]|\d+[\.\)]|\([a-z0-9]+\))\s+/i.test(line);
    if (isBullet) {
      const t = stripBullet(line);
      if (t) items.push({ title: t });
    } else if (items.length > 0 && !sawExplicitItem) {
      const last = items[items.length - 1];
      last.title = `${last.title} ${trimmed}`.trim();
    }
  }

  return items.map((it, i) => ({
    unit_no: i + 1,
    title: it.title.slice(0, 300),
    hours: 0,
    lecture_hours: 0,
    practical_hours: 0,
    topics: [],
  }));
}


