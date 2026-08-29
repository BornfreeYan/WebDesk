/** Only http(s) may be opened as bookmarks. */
export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|about|blob|place|chrome|edge|opera):/i;

/** Prefix https:// when the user omitted a scheme, then validate. */
export function normalizeBookmarkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || BLOCKED_SCHEME.test(trimmed)) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isHttpUrl(withScheme) ? withScheme : null;
}

export function openBookmarkUrl(url: string): boolean {
  if (!isHttpUrl(url) || BLOCKED_SCHEME.test(url)) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
