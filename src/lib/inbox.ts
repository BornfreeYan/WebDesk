import type { Bookmark } from '../types';

export const INBOX_FOLDER_NAME = 'Inbox';

/** 递归查找任意层级的书签/文件夹。 */
export function findBookmarkById(items: Bookmark[], id: string): Bookmark | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findBookmarkById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Inbox 条目，最新在前。
 * 缺 createdAt 的条目（例如从桌面手动拖进来的旧书签）按 0 处理，排在末尾。
 */
export function getInboxItems(bookmarks: Bookmark[], inboxFolderId?: string): Bookmark[] {
  if (!inboxFolderId) return [];
  const folder = findBookmarkById(bookmarks, inboxFolderId);
  if (!folder || folder.type !== 'folder' || !folder.children) return [];
  return [...folder.children].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** 桌面落位规则，与新建书签/文件夹的网格保持一致。 */
function desktopGridPosition(count: number): { x: number; y: number } {
  return {
    x: 40 + (count % 8) * 90,
    y: 40 + Math.floor(count / 8) * 110,
  };
}

/** 新建 Inbox 文件夹，返回新的书签数组与文件夹本身。 */
export function createInboxFolder(bookmarks: Bookmark[]): { bookmarks: Bookmark[]; folder: Bookmark } {
  const folder: Bookmark = {
    id: `folder-${crypto.randomUUID()}`,
    name: INBOX_FOLDER_NAME,
    type: 'folder',
    position: desktopGridPosition(bookmarks.length),
    children: [],
  };
  return { bookmarks: [...bookmarks, folder], folder };
}

/** 把条目追加进指定文件夹的 children（递归查找，防扁平化）。 */
export function appendToFolder(bookmarks: Bookmark[], folderId: string, item: Bookmark): Bookmark[] {
  return bookmarks.map((b): Bookmark => {
    if (b.id === folderId && b.type === 'folder') {
      return { ...b, children: [...(b.children ?? []), item] };
    }
    if (b.children) {
      return { ...b, children: appendToFolder(b.children, folderId, item) };
    }
    return b;
  });
}

/**
 * 由 URL 推导显示名：去掉协议与 www.，保留路径，丢弃查询串与锚点。
 * 同一站点的多条链接靠路径区分（例如 bilibili.com/video/BV1xx）。
 */
export function deriveNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    const combined = `${host}${path}`;
    return combined.length > 48 ? `${combined.slice(0, 47)}…` : combined;
  } catch {
    return url;
  }
}

/** 新造一条 Inbox 条目。favicon 不落库，由 FaviconImg 按 url 现取。 */
export function createInboxItem(url: string, note: string): Bookmark {
  const trimmedNote = note.trim();
  const item: Bookmark = {
    id: `bookmark-${crypto.randomUUID()}`,
    name: deriveNameFromUrl(url),
    type: 'link',
    url,
    position: { x: 0, y: 0 },
    createdAt: Date.now(),
  };
  if (trimmedNote) item.note = trimmedNote;
  return item;
}
