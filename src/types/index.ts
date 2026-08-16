export interface Bookmark {
  id: string;
  name: string;
  type: 'link' | 'folder';
  url?: string;
  favicon?: string;
  position: { x: number; y: number };
  children?: Bookmark[];
  category?: string;
}

export interface DesktopSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  wallpaper: string;
  customWallpaper?: string;
  showDock: boolean;
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
}
