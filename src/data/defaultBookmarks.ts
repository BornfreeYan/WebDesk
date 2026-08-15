import type { DesktopData } from '../types';

export const defaultData: DesktopData = {
  version: 1,
  settings: {
    theme: 'dark',
    accentColor: '#007AFF',
    wallpaper: 'default',
    showDock: true,
  },
  bookmarks: [],
  dockItems: [],
};
