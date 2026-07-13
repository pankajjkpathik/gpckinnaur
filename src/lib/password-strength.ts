export type PasswordCheck = { key: string; label: string; ok: boolean };

export function checkPasswordStrength(pw: string, currentPw?: string): PasswordCheck[] {
  return [
    { key: "len", label: "At least 8 characters", ok: pw.length >= 8 },
    { key: "upper", label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(pw) },
    { key: "lower", label: "One lowercase letter (a–z)", ok: /[a-z]/.test(pw) },
    { key: "digit", label: "One number (0–9)", ok: /\d/.test(pw) },
    { key: "special", label: "One special character (!@#$…)", ok: /[^A-Za-z0-9]/.test(pw) },
    { key: "diff", label: "Different from current password", ok: pw.length > 0 && (!currentPw || pw !== currentPw) },
  ];
}

export function isPasswordStrong(pw: string, currentPw?: string): boolean {
  return checkPasswordStrength(pw, currentPw).every((c) => c.ok);
}

export function firstPasswordStrengthError(pw: string, currentPw?: string): string | null {
  const failed = checkPasswordStrength(pw, currentPw).find((c) => !c.ok);
  return failed ? `Password requirement not met: ${failed.label}.` : null;
}
