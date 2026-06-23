const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const HOST_HAS_DOT = /^[^\s]+\.[^\s]+$/;

export function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;

  if (SCHEME_PATTERN.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) return false;
    const host = trimmed.replace(/^https?:\/\//i, "");
    return HOST_HAS_DOT.test(host) && host !== "" && !host.startsWith(".");
  }

  return HOST_HAS_DOT.test(trimmed) && !trimmed.startsWith(".");
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
