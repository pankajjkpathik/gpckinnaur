import { facultyPhoto } from "@/lib/faculty-photos";

export function displayName(me: { name?: string | null; username?: string | null; enrollmentNo?: string | null } | null | undefined): string {
  if (!me) return "";
  return (me.name || me.username || me.enrollmentNo || "").toString().toUpperCase();
}

export function avatarUrl(me: { name?: string | null; image_url?: string | null } | null | undefined): string | null {
  if (!me) return null;
  if (me.image_url) return me.image_url;
  return facultyPhoto(me.name ?? null);
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
