export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  } catch {
    return '';
  }
}

export function initialLetter(name: string): string {
  return name.charAt(0).toUpperCase() || '?';
}

/** Google s2 在站点没有 favicon 时仍返回 200，图是 16×16 的默认地球标。请求 sz=128 时真图标通常更大。 */
export function isGenericFaviconPlaceholder(img: HTMLImageElement): boolean {
  return img.naturalWidth > 0 && img.naturalWidth < 32;
}
