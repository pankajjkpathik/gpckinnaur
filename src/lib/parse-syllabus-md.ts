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
  hours: number;
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
        const h = title.match(HOURS_INLINE_RE);
        if (h) {
          hours = Number(h[1]);
          title = title.replace(HOURS_INLINE_RE, "").trim();
        }
        title = title.replace(/^[:.\-–—\s]+/, "").replace(/[:.\-–—\s]+$/, "").trim();
        cur = { unit_no: n, title: title || `Unit ${n}`, hours, topics: [] };
        continue;
      }
    }
    if (!cur) continue;

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
    // Skip generic label lines
    if (/^(topics?|contents?|sub[-\s]?topics?|syllabus)\s*[:\-]?\s*$/i.test(trimmed)) continue;
    // Skip markdown table separators
    if (/^[|\-:\s]+$/.test(trimmed)) continue;

    const bulletMatch = /^\s*([-*+•]|\d+[\.\)]|\([a-z0-9]+\))\s+/i.test(line);
    if (bulletMatch) {
      const t = stripBullet(line);
      if (t) cur.topics.push(...splitInline(t));
    } else {
      // Non-bullet paragraph line: split on commas/semicolons if it looks like a list
      if (/[,;]/.test(trimmed) && trimmed.length < 300) {
        cur.topics.push(...splitInline(trimmed));
      } else if (trimmed.length < 200 && !/^#{1,6}\s/.test(trimmed)) {
        cur.topics.push(trimmed);
      }
    }
  }
  commit();

  // Sort by unit_no and ensure unique
  units.sort((a, b) => a.unit_no - b.unit_no);
  return units;
}

// Rescale unit hours proportionally so they sum to `target`.
export function rescaleHours(units: ParsedUnit[], target: number): ParsedUnit[] {
  if (target <= 0 || units.length === 0) return units;
  const total = units.reduce((s, u) => s + (u.hours || 0), 0);
  if (total <= 0) {
    // even split
    const base = Math.floor(target / units.length);
    const rem = target - base * units.length;
    return units.map((u, i) => ({ ...u, hours: base + (i < rem ? 1 : 0) }));
  }
  const scaled = units.map((u) => ({ ...u, hours: (u.hours * target) / total }));
  const floored = scaled.map((u) => ({ ...u, hours: Math.floor(u.hours) }));
  let diff = target - floored.reduce((s, u) => s + u.hours, 0);
  // distribute leftover to units with largest fractional parts
  const order = scaled
    .map((u, i) => ({ i, frac: u.hours - Math.floor(u.hours) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && diff > 0; k++, diff--) {
    floored[order[k].i].hours += 1;
  }
  return floored;
}
