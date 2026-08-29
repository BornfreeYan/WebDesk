export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  } catch {
    return '';
  }
}

/** 第一个完整字形（emoji / 国旗 / 肤色序列），避免 charAt(0) 拆开代理对。 */
export function firstGrapheme(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const iter = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(trimmed)[Symbol.iterator]();
    return iter.next().value?.segment ?? '?';
  }
  return Array.from(trimmed)[0] ?? '?';
}

export function isEmojiGrapheme(glyph: string): boolean {
  return /\p{Extended_Pictographic}/u.test(glyph);
}

export function nameStartsWithEmoji(name: string): boolean {
  return isEmojiGrapheme(firstGrapheme(name));
}

export function initialLetter(name: string): string {
  const glyph = firstGrapheme(name);
  if (isEmojiGrapheme(glyph)) return glyph;
  return glyph.toUpperCase();
}

/** Google s2 在站点没有 favicon 时仍返回 200，图是 16×16 的默认地球标。请求 sz=128 时真图标通常更大。 */
export function isGenericFaviconPlaceholder(img: HTMLImageElement): boolean {
  return img.naturalWidth > 0 && img.naturalWidth < 32;
}
