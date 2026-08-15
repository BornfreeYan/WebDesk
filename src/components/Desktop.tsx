import type { Bookmark } from '../types';
import { DesktopIcon } from './DesktopIcon';

interface DesktopProps {
  bookmarks: Bookmark[];
  isDark: boolean;
  onDelete: (id: string) => void;
  onToggleDock: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  dockItems: string[];
}

export function Desktop({ bookmarks, isDark, onDelete, onToggleDock, onOpenFolder, onRename, dockItems }: DesktopProps) {
  return (
    <div className="absolute inset-0 bottom-[110px] p-6 overflow-auto">

      {bookmarks.map((bookmark) => (
        <DesktopIcon
          key={bookmark.id}
          bookmark={bookmark}
          isDark={isDark}
          onDelete={onDelete}
          onToggleDock={onToggleDock}
          onOpenFolder={onOpenFolder}
          onRename={onRename}
          isInDock={dockItems.includes(bookmark.id)}
        />
      ))}

      {bookmarks.length === 0 && (
        <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
            <span className="text-4xl">📭</span>
          </div>
          <p className="text-base font-medium mb-1">桌面空空如也</p>
          <p className="text-sm opacity-70">点击 Dock 栏的 + 号添加书签，或拖拽导入 HTML</p>
        </div>
      )}
    </div>
  );
}
