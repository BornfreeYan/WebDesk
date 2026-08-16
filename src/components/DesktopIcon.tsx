import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Bookmark } from '../types';
import { X, Pin, Trash2, Folder } from 'lucide-react';
import { useState, useRef } from 'react';

interface DesktopIconProps {
  bookmark: Bookmark;
  isDark: boolean;
  onDelete: (id: string) => void;
  onToggleDock: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onOpenMoveDialog: (itemId: string, itemName: string) => void;
  isInDock: boolean;
}

export function DesktopIcon({ bookmark, isDark, onDelete, onToggleDock, onOpenFolder, onRename, onOpenMoveDialog, isInDock }: DesktopIconProps) {
  const { attributes, listeners = {}, setNodeRef, transform, isDragging } = useDraggable({
    id: bookmark.id,
  });

  // 文件夹图标同时作为拖拽放置目标
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: bookmark.type === 'folder' ? `drop-${bookmark.id}` : 'not-droppable',
    disabled: bookmark.type !== 'folder',
  });

  // 合并 draggable 和 droppable 的 ref
  const mergedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    if (bookmark.type === 'folder') {
      setDropRef(node);
    }
  };

  const [showDelete, setShowDelete] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(bookmark.name);
  const ptrStart = useRef<{ x: number; y: number } | null>(null);
  const isRightClick = useRef(false);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const faviconUrl = bookmark.type === 'link' ? (bookmark.favicon || getFaviconUrl(bookmark.url || '')) : '';

  const mergedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // 检测右键 (button === 2)
      isRightClick.current = e.button === 2;
      ptrStart.current = { x: e.clientX, y: e.clientY };
      listeners.onPointerDown?.(e);
    },
    onPointerUp: (e: React.PointerEvent) => {
      listeners.onPointerUp?.(e);
      if (ptrStart.current && !isRightClick.current) {
        const dx = Math.abs(e.clientX - ptrStart.current.x);
        const dy = Math.abs(e.clientY - ptrStart.current.y);
        // 位移小于 8px 视为单击，打开链接
        if (dx < 8 && dy < 8 && !isDragging) {
          if (bookmark.type === 'folder') {
            onOpenFolder(bookmark.id);
          } else if (bookmark.url) {
            window.open(bookmark.url, '_blank');
          }
        }
      }
      ptrStart.current = null;
      isRightClick.current = false;
    },
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  return (
    <>
      <div
        ref={mergedRef}
        style={{
          ...style,
          position: 'absolute',
          left: bookmark.position.x,
          top: bookmark.position.y,
          zIndex: isDragging ? 50 : showContextMenu ? 20 : 1,
          transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
        className={`group select-none ${isDragging ? 'scale-115' : ''}`}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        onContextMenu={handleContextMenu}
        {...mergedListeners}
        {...attributes}
      >
        {/* 删除按钮 */}
        {showDelete && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 hover:bg-red-500"
          >
            <X size={12} strokeWidth={3} />
          </button>
        )}

        {/* 图标容器 */}
        <div
          className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-2xl mb-2 transition-all duration-150 ${
            isDragging
              ? 'scale-110'
              : ''
          } ${bookmark.type === 'folder' && isOver ? 'ring-2 ring-blue-400 ring-offset-2 scale-110' : ''}`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {bookmark.type === 'folder' ? (
            <Folder size={32} className={isDark ? 'text-white/70' : 'text-gray-500'} />
          ) : faviconUrl ? (
            <img
              src={faviconUrl}
              alt={bookmark.name}
              className="w-10 h-10 rounded-xl object-contain"
              draggable={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<span class="text-xl font-bold ${isDark ? 'text-white/60' : 'text-gray-400'}">${bookmark.name.charAt(0).toUpperCase()}</span>`;
              }}
            />
          ) : (
            <span className={`text-xl font-bold ${isDark ? 'text-white/60' : 'text-gray-400'}`}>
              {bookmark.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* 文字标签 — 支持重命名 */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(bookmark.id, renameValue.trim() || bookmark.name);
                setIsRenaming(false);
              }
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setRenameValue(bookmark.name);
              }
            }}
            onBlur={() => {
              onRename(bookmark.id, renameValue.trim() || bookmark.name);
              setIsRenaming(false);
            }}
            className={`text-[13px] font-medium px-1 py-1 rounded-lg max-w-[88px] text-center shadow-sm leading-tight outline-none border ${
              isDark
                ? 'bg-black/60 text-white/90 border-white/30'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          />
        ) : (
          <span
            className={`text-[12px] font-medium px-1 py-0.5 max-w-[88px] text-center leading-snug line-clamp-2 break-words ${
              isDark ? 'text-white/90' : 'text-gray-700'
            }`}
          >
            {bookmark.name}
          </span>
        )}
      </div>

      {/* 右键菜单 */}
      {showContextMenu && (
        <div
          className="fixed z-50 rounded-xl shadow-2xl overflow-hidden py-1 min-w-[160px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={() => setShowContextMenu(false)}
        >
          <div className={`${isDark ? 'bg-gray-800/95 border border-white/10 text-white' : 'bg-white/95 border border-gray-200 text-gray-800'} backdrop-blur-xl`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setRenameValue(bookmark.name);
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
            >
              <span className="w-3.5 h-3.5 text-xs flex items-center justify-center">✏️</span>
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDock(bookmark.id);
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
            >
              <Pin size={14} className={isInDock ? 'text-blue-400' : ''} />
              {isInDock ? 'Unpin from Dock' : 'Pin to Dock'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenMoveDialog(bookmark.id, bookmark.name);
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
            >
              <Folder size={14} className="opacity-70" />
              Move to Folder…
            </button>
            <div className={`h-px mx-2 my-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bookmark.id);
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-red-400 hover:bg-red-50 transition-colors text-left ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* 点击其他区域关闭右键菜单 */}
      {showContextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
      )}
    </>
  );
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
}
