import type { Bookmark, DesktopData } from '../types';

/**
 * 规整从外部来的书签树（GitHub 云端 / 导入的 JSON / 旧版本 localStorage）。
 *
 * 这些数据不归我们控制：缺 `position` 会让 DesktopIcon 读到 undefined 直接白屏，
 * 缺 `type` 会让图标渲染分支落空。宁可在入口处丢掉坏节点，也不要整页崩掉。
 */
export function sanitizeBookmarks(input: unknown): Bookmark[] {
  if (!Array.isArray(input)) return [];
  const out: Bookmark[] = [];

  input.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const b = raw as Partial<Bookmark>;
    if (typeof b.id !== 'string' || !b.id) return;

    const type = b.type === 'folder' ? 'folder' : 'link';
    const pos = b.position;
    const node: Bookmark = {
      id: b.id,
      name: typeof b.name === 'string' && b.name ? b.name : 'Untitled',
      type,
      position: {
        x: typeof pos?.x === 'number' && Number.isFinite(pos.x) ? pos.x : 40 + (index % 8) * 90,
        y: typeof pos?.y === 'number' && Number.isFinite(pos.y) ? pos.y : 40 + Math.floor(index / 8) * 110,
      },
    };

    if (typeof b.url === 'string' && b.url) node.url = b.url;
    if (typeof b.favicon === 'string' && b.favicon) node.favicon = b.favicon;
    if (typeof b.note === 'string' && b.note) node.note = b.note;
    if (typeof b.createdAt === 'number' && Number.isFinite(b.createdAt)) node.createdAt = b.createdAt;
    if (type === 'folder' && Array.isArray(b.children)) node.children = sanitizeBookmarks(b.children);

    out.push(node);
  });

  return out;
}

/** 只保留真实存在的书签 id，避免 Dock 里挂着已删除项。 */
export function sanitizeDockItems(items: unknown, bookmarks: Bookmark[]): string[] {
  if (!Array.isArray(items)) return [];
  const alive = new Set<string>();
  const walk = (list: Bookmark[]) => {
    for (const b of list) {
      alive.add(b.id);
      if (b.children) walk(b.children);
    }
  };
  walk(bookmarks);
  return items.filter((id): id is string => typeof id === 'string' && alive.has(id));
}

/**
 * 整份数据的入口校验：结构不对时返回 null，由调用方保留本地数据。
 * inboxFolderId 指向的文件夹若已不存在，也一并清掉，避免 Inbox 组件空转。
 */
export function sanitizeDesktopData(input: unknown, fallbackVersion = 1): DesktopData | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<DesktopData>;
  if (!raw.settings || typeof raw.settings !== 'object') return null;

  const bookmarks = sanitizeBookmarks(raw.bookmarks);
  const dockItems = sanitizeDockItems(raw.dockItems, bookmarks);

  const settings = { ...raw.settings } as DesktopData['settings'];
  if (typeof settings.theme !== 'string') settings.theme = 'light';
  if (typeof settings.wallpaper !== 'string') settings.wallpaper = 'default';
  if (typeof settings.accentColor !== 'string') settings.accentColor = '#007AFF';
  settings.showDock = true;

  const inboxId = settings.inboxFolderId;
  if (inboxId) {
    const exists = (list: Bookmark[]): boolean =>
      list.some((b) => b.id === inboxId || (b.children ? exists(b.children) : false));
    if (!exists(bookmarks)) delete settings.inboxFolderId;
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : fallbackVersion,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : undefined,
    settings,
    bookmarks,
    dockItems,
  };
}
