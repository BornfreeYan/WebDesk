export interface Bookmark {
  id: string;
  name: string;
  type: 'link' | 'folder';
  url?: string;
  favicon?: string;
  position: { x: number; y: number };
  children?: Bookmark[];
  category?: string;
  /** 备注：为什么收藏这条链接（例如「之后看看这个 GO 语法教程」）。 */
  note?: string;
  /** 入库时间戳，用于 Inbox 按最新排序。 */
  createdAt?: number;
}

export interface DesktopSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  wallpaper: string;
  customWallpaper?: string;
  showDock: boolean;
  /** Inbox 文件夹的 id。缺省表示尚未创建，首次入库时懒创建。 */
  inboxFolderId?: string;
}

export interface DesktopData {
  version: number;
  updatedAt?: number;
  settings: DesktopSettings;
  bookmarks: Bookmark[];
  dockItems: string[];
}

export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export type SyncStatus =
  | { type: 'idle' }
  | { type: 'syncing' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface WidgetState {
  x: number;
  y: number;
  enabled: boolean;
}

export interface WidgetsData {
  clock: WidgetState;
  todo: WidgetState & { items: TodoItem[] };
  /** 只保存位置与开关；条目内容存在书签树里（settings.inboxFolderId 指向的文件夹）。 */
  inbox: WidgetState;
}
