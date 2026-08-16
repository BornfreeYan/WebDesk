import { useState, useRef, useEffect, useMemo } from 'react';
import type { Bookmark } from '../types';
import { X, Folder, Trash2, Plus } from 'lucide-react';

interface FolderWindowProps {
  folderId: string;
  allBookmarks: Bookmark[];
  isDark: boolean;
  accentColor: string;
  onClose: () => void;
  onOpenFolder: (folderId: string) => void;
  onOpenLink: (url: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onMoveToDesktop: (id: string) => void;
}

function findBookmarkById(bookmarks: Bookmark[], id: string): Bookmark | undefined {
  for (const b of bookmarks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBookmarkById(b.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function FolderWindow({
  folderId,
  allBookmarks,
  isDark,
  accentColor,
  onClose,
  onOpenFolder,
  onOpenLink,
  onDelete,
  onRename,
  onCreateSubfolder,
  onMoveToDesktop,
}: FolderWindowProps) {
  const folder = useMemo(() => findBookmarkById(allBookmarks, folderId), [allBookmarks, folderId]);
  const [position, setPosition] = useState({ x: Math.max(40, window.innerWidth / 2 - 200), y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    itemId: string;
    isFolder: boolean;
  } | null>(null);

  // 重命名状态
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-title-bar') && !(e.target as HTMLElement).closest('.window-btn')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 480, e.clientX - dragStart.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragStart.current.y)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!folder || folder.type !== 'folder') return null;

  const bgClass = isDark ? 'bg-gray-800/85 border-white/10 text-white' : 'bg-white/85 border-white/50 text-gray-800';

  return (
    <>
      {/* 窗口主体 */}
      <div
        className="fixed z-50 animate-window-enter"
        style={{ left: position.x, top: position.y, width: '480px' }}
        onMouseDown={handleMouseDown}
      >
        <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${bgClass}`}>
          {/* 标题栏 */}
          <div className="window-title-bar flex items-center gap-2 px-4 py-3 cursor-move border-b border-white/5">
            <div className="flex gap-2">
              <button onClick={onClose} className="window-btn w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center group cursor-default">
                <X size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
              </button>
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="ml-3 text-xs font-medium opacity-50 tracking-wide flex items-center gap-1.5">
              <Folder size={12} />
              {folder.name}
            </span>
          </div>

          {/* 内容区 */}
          <div className="px-5 py-4 max-h-[360px] overflow-y-auto relative">
            {/* 新建子文件夹按钮（右上角） */}
            <button
              onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folderId); }}
              className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors z-10 ${
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-gray-500'
              }`}
              title="新建子文件夹"
            >
              <Plus size={16} />
            </button>

            {!folder.children || folder.children.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <Folder size={32} className="mb-2" />
                <p className="text-sm">文件夹为空</p>
                <p className="text-xs mt-1 opacity-70">点击右上角 + 新建子文件夹</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 pt-4">
                {folder.children.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer hover:bg-black/5 transition-colors relative"
                    onClick={() => {
                      if (item.type === 'link' && item.url) {
                        onOpenLink(item.url);
                      } else if (item.type === 'folder') {
                        onOpenFolder(item.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        show: true,
                        x: e.clientX,
                        y: e.clientY,
                        itemId: item.id,
                        isFolder: item.type === 'folder',
                      });
                      setRenamingId(null);
                    }}
                  >
                  {/* 悬停删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                      setContextMenu(null);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-500"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>

                    <div
                      className="w-14 h-14 rounded-[16px] flex items-center justify-center transition-all"
                    >
                      {item.type === 'folder' ? (
                        <Folder size={24} style={{ color: accentColor }} />
                      ) : item.favicon || getFaviconUrl(item.url || '') ? (
                        <img
                          src={item.favicon || getFaviconUrl(item.url || '')}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-contain"
                          draggable={false}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="text-lg font-bold ${isDark ? 'text-white/60' : 'text-gray-400'}">${item.name.charAt(0).toUpperCase()}</span>`;
                          }}
                        />
                      ) : (
                        <span className={`text-lg font-bold ${isDark ? 'text-white/60' : 'text-gray-400'}`}>
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* 文字标签 — 支持重命名 */}
                    {renamingId === item.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onRename(item.id, renameValue.trim() || item.name);
                            setRenamingId(null);
                          }
                          if (e.key === 'Escape') {
                            setRenamingId(null);
                            setRenameValue(item.name);
                          }
                        }}
                        onBlur={() => {
                          onRename(item.id, renameValue.trim() || item.name);
                          setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-[11px] font-medium w-full text-center rounded px-1 py-0.5 outline-none border ${
                          isDark
                            ? 'bg-black/60 text-white/90 border-white/30'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      />
                    ) : (
                      <span className={`text-[11px] font-medium text-center leading-tight max-w-full truncate px-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        {item.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右键菜单 — 独立的 fixed 层，用全局坐标 */}
      {contextMenu?.show && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-[70] rounded-xl shadow-2xl overflow-hidden py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className={`${isDark ? 'bg-gray-800/95 border border-white/10 text-white' : 'bg-white/95 border border-gray-200 text-gray-800'} backdrop-blur-xl`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(contextMenu.itemId);
                  const target = findBookmarkById(allBookmarks, contextMenu.itemId);
                  setRenameValue(target?.name || '');
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
              >
                <span className="w-3.5 h-3.5 text-xs flex items-center justify-center">✏️</span>
                重命名
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToDesktop(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
              >
                <span className="w-3.5 h-3.5 text-xs flex items-center justify-center">📤</span>
                移到桌面
              </button>
              <div className={`h-px mx-2 my-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-red-400 hover:bg-red-50 transition-colors text-left ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
              >
                <Trash2 size={14} />
                删除
              </button>
            </div>
          </div>
        </>
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
