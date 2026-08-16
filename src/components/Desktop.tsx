import type { Bookmark } from '../types';
import { DesktopIcon } from './DesktopIcon';

interface DesktopProps {
  bookmarks: Bookmark[];
  isDark: boolean;
  onDelete: (id: string) => void;
  onToggleDock: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onOpenMoveDialog: (itemId: string, itemName: string) => void;
  dockItems: string[];
}

export function Desktop({ bookmarks, isDark, onDelete, onToggleDock, onOpenFolder, onRename, onOpenMoveDialog, dockItems }: DesktopProps) {
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
          onOpenMoveDialog={onOpenMoveDialog}
          isInDock={dockItems.includes(bookmark.id)}
        />
      ))}

      {bookmarks.length === 0 && (
        <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
            <span className="text-4xl">📭</span>
          </div>
          <p className="text-base font-medium mb-1">The desktop is empty</p>
          <p className="text-sm opacity-70">Click + in the Dock to add a bookmark, or drag &amp; drop an HTML bookmark file to import</p>
        </div>
      )}
    </div>
  );
}
