import { useMemo } from 'react';
import type { Bookmark } from '../types';
import { X, Folder } from 'lucide-react';

/** 收集所有文件夹节点（扁平化），返回 id/name/深度 */
function collectFolders(items: Bookmark[], depth: number, out: { id: string; name: string; depth: number }[]) {
  for (const b of items) {
    if (b.type === 'folder') {
      out.push({ id: b.id, name: b.name, depth });
      if (b.children) collectFolders(b.children, depth + 1, out);
    }
  }
}

/** 判断 targetId 是否是 ancestorId 的子孙（用于排除移动目标，防止循环） */
function isDescendantOf(targetId: string, ancestorId: string, items: Bookmark[]): boolean {
  for (const b of items) {
    if (b.id === ancestorId && b.children) {
      return b.children.some(
        (c) => c.id === targetId || (c.children && isDescendantOf(targetId, c.id, [c]))
      );
    }
    if (b.children && isDescendantOf(targetId, ancestorId, b.children)) return true;
  }
  return false;
}

export function MoveToFolderDialog({
  itemId,
  itemName,
  allBookmarks,
  isDark,
  accentColor,
  onSelect,
  onClose,
}: {
  itemId: string;
  itemName: string;
  allBookmarks: Bookmark[];
  isDark: boolean;
  accentColor: string;
  onSelect: (targetId: string) => void;
  onClose: () => void;
}) {
  const folders = useMemo(() => {
    const all: { id: string; name: string; depth: number }[] = [];
    collectFolders(allBookmarks, 0, all);
    // 排除：自身、自身子孙（防循环）
    return all.filter((f) => f.id !== itemId && !isDescendantOf(f.id, itemId, allBookmarks));
  }, [allBookmarks, itemId]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`rounded-2xl shadow-2xl w-80 max-h-96 flex flex-col overflow-hidden ${isDark ? 'bg-gray-800/95 border border-white/10 text-white' : 'bg-white/95 border border-gray-200 text-gray-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-white/10 text-sm font-medium flex items-center justify-between">
          <span>Move “{itemName}” to…</span>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {folders.length === 0 && (
            <p className="px-4 py-4 text-xs opacity-50 text-center">No target folders available</p>
          )}
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`w-full px-4 py-2 text-sm flex items-center gap-2 text-left transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'
              }`}
              style={{ paddingLeft: 12 + f.depth * 16 }}
            >
              <Folder size={13} style={{ color: accentColor }} />
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
