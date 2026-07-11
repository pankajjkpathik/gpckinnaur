// Central mapping between department display names (stored on staff_users.department)
// and short branch codes (stored on students.branch / subjects.branch / timetable.branch).
// Without this, HOD-scoped queries silently return nothing because staff carry
// "Civil Engineering" while academic tables carry "civil".

export const BRANCH_TO_DEPT: Record<string, string> = {
  civil: "Civil Engineering",
  mechanical: "Mechanical Engineering",
  applied_science: "Applied Sciences",
};

export function deptToBranch(dept?: string | null): string {
  if (!dept) return "";
  const d = dept.trim().toLowerCase();
  // exact department name match
  for (const [code, name] of Object.entries(BRANCH_TO_DEPT)) {
    if (name.toLowerCase() === d) return code;
  }
  // already a branch code
  if (BRANCH_TO_DEPT[d]) return d;
  // legacy "applied_science" variants
  if (d.replace(/\s+/g, "_") in BRANCH_TO_DEPT) return d.replace(/\s+/g, "_");
  // fallback: first word (e.g. "Civil" → "civil")
  return d.split(/[\s_]+/)[0];
}

export function branchToDept(branch: string): string {
  return BRANCH_TO_DEPT[branch] ?? branch;
}

// Every stored spelling a staff_users.department column might contain for a
// given branch code. Used with `.in("department", ...)` so filters work
// regardless of whether the row was written with the full name, the code,
// or a legacy variant.
export function departmentAliases(branch: string): string[] {
  const aliases = new Set<string>();
  aliases.add(branch);
  const name = BRANCH_TO_DEPT[branch];
  if (name) {
    aliases.add(name);
    aliases.add(name.toLowerCase());
  }
  if (branch === "applied_science") aliases.add("Applied Science");
  return Array.from(aliases);
}
