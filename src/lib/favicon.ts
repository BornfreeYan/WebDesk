export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
}

export function initialLetter(name: string): string {
  return name.charAt(0).toUpperCase() || '?';
}
