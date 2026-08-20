import { useState, useCallback } from 'react';
import { DndContext, type DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Desktop } from './components/Desktop';
import { Dock } from './components/Dock';
import { SettingsWindow } from './components/SettingsWindow';
import { BookmarkImporter } from './components/BookmarkImporter';
import { FolderWindow } from './components/FolderWindow';
import { SearchBar } from './components/SearchBar';
import { ClockWidget } from './components/widgets/ClockWidget';
import { TodoWidget } from './components/widgets/TodoWidget';
import { MoveToFolderDialog } from './components/MoveToFolderDialog';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSync } from './hooks/useSync';
import { defaultData } from './data/defaultBookmarks';
import type { DesktopData, DesktopSettings, Bookmark, SyncConfig, WidgetsData } from './types';

const defaultWidgets: WidgetsData = {
  clock: { x: 24, y: 90, enabled: true },
  todo: { x: 24, y: 260, enabled: true, items: [] },
};

function App() {
  const [data, setData] = useLocalStorage<DesktopData>('webdesk-data-v3', defaultData);
  const [syncConfig, setSyncConfig] = useLocalStorage<SyncConfig>('webdesk-sync-config', {
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
  });
  const [widgets, setWidgets] = useLocalStorage<WidgetsData>('webdesk-widgets-v1', defaultWidgets);
  const sync = useSync(data, setData, syncConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ name: '', url: '' });
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [windowStack, setWindowStack] = useState<string[]>([]);
  const [moveDialog, setMoveDialog] = useState<{ itemId: string; itemName: string } | null>(null);

  // 窗口置顶：点击窗口时把它移到栈尾（最上层）
  const focusWindow = useCallback((id: string) => {
    setWindowStack((prev) => [...prev.filter((w) => w !== id), id]);
  }, []);

  // 打开文件夹窗口（加入 openFolders 与 windowStack）
  const openFolderWindow = useCallback((id: string) => {
    setOpenFolders((prev) => (prev.includes(id) ? prev : [...prev, id]));
    focusWindow(id);
  }, [focusWindow]);

  // 打开设置窗口
  const openSettingsWindow = useCallback(() => {
    setShowSettings(true);
    focusWindow('settings');
  }, [focusWindow]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta, over } = event;
    const id = active.id as string;

    // 如果拖入了某个文件夹
    if (over && String(over.id).startsWith('drop-')) {
      const folderId = String(over.id).replace('drop-', '');
      setData((prev) => {
        const dragged = prev.bookmarks.find((b) => b.id === id);
        if (!dragged) return prev;
        const draggedBookmark = dragged;
        // 不能把自己拖入自己
        if (id === folderId) return prev;
        // 防循环：文件夹不能拖入自身子孙
        if (draggedBookmark.type === 'folder' && draggedBookmark.children) {
          const contains = (items: Bookmark[]): boolean =>
            items.some((b) => b.id === folderId || (b.children && contains(b.children)));
          if (contains(draggedBookmark.children)) return prev;
        }

        // 从桌面书签列表中移除
        const newBookmarks = prev.bookmarks.filter((b) => b.id !== id);

        // 找到目标文件夹，把书签加入其 children
        function addToFolder(items: Bookmark[]): Bookmark[] {
          return items.map((item): Bookmark => {
            if (item.id === folderId && item.type === 'folder') {
              return {
                ...item,
                children: [...(item.children || []), draggedBookmark],
              };
            }
            if (item.children) {
              return { ...item, children: addToFolder(item.children) };
            }
            return item;
          });
        }

        return {
          ...prev,
          bookmarks: addToFolder(newBookmarks),
        };
      });
      return;
    }

    // 否则是普通拖拽（移动位置）
    setData((prev) => {
      const bookmark = prev.bookmarks.find((b) => b.id === id);
      if (!bookmark) return prev;

      // 边界限制：图标不超出屏幕，也不进入 Dock 栏区域
      const maxX = window.innerWidth - 90;
      const maxY = window.innerHeight - 130;

      const rawX = bookmark.position.x + delta.x;
      const rawY = bookmark.position.y + delta.y;

      const newX = Math.max(8, Math.min(maxX, rawX));
      const newY = Math.max(8, Math.min(maxY, rawY));

      const newBookmarks = prev.bookmarks.map((b) =>
        b.id === id ? { ...b, position: { x: newX, y: newY } } : b
      );

      return { ...prev, bookmarks: newBookmarks };
    });
  }, [setData]);

  const handleAddBookmark = () => {
    if (newBookmark.name.trim() && newBookmark.url.trim()) {
      let url = newBookmark.url.trim();
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      const bookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        name: newBookmark.name.trim(),
        type: 'link',
        url,
        position: { x: 40 + (data.bookmarks.length % 8) * 90, y: 40 + Math.floor(data.bookmarks.length / 8) * 110 },
      };

      setData((prev) => ({
        ...prev,
        bookmarks: [...prev.bookmarks, bookmark],
      }));

      setNewBookmark({ name: '', url: '' });
      setShowAddDialog(false);
    }
  };

  const handleDeleteBookmark = (id: string) => {
    setData((prev) => {
      function removeFromTree(items: Bookmark[]): Bookmark[] {
        const result: Bookmark[] = [];
        for (const item of items) {
          if (item.id === id) continue; // 跳过要删除的
          if (item.children) {
            result.push({ ...item, children: removeFromTree(item.children) });
          } else {
            result.push(item);
          }
        }
        return result;
      }
      return {
        ...prev,
        bookmarks: removeFromTree(prev.bookmarks),
        dockItems: prev.dockItems.filter((item) => item !== id),
      };
    });
    setOpenFolders((prev) => prev.filter((folderId) => folderId !== id));
  };

  const handleRename = (id: string, newName: string) => {
    setData((prev) => {
      function renameInList(items: Bookmark[]): Bookmark[] {
        return items.map((item): Bookmark => {
          if (item.id === id) {
            return { ...item, name: newName };
          }
          if (item.children) {
            return { ...item, children: renameInList(item.children) };
          }
          return item;
        });
      }
      return {
        ...prev,
        bookmarks: renameInList(prev.bookmarks),
      };
    });
  };

  const handleMoveToDesktop = (id: string) => {
    setData((prev) => {
      let moved: Bookmark | undefined;

      function removeFromFolder(items: Bookmark[]): Bookmark[] {
        const result: Bookmark[] = [];
        for (const item of items) {
          if (item.id === id) {
            moved = item;
            continue;
          }
          if (item.children) {
            result.push({ ...item, children: removeFromFolder(item.children) });
          } else {
            result.push(item);
          }
        }
        return result;
      }

      const newBookmarks = removeFromFolder(prev.bookmarks);
      if (moved) {
        // 分配一个不重叠的桌面位置
        const idx = newBookmarks.length;
        moved = {
          ...moved,
          position: {
            x: 40 + (idx % 8) * 90,
            y: 40 + Math.floor(idx / 8) * 110,
          },
        };
        newBookmarks.push(moved);
      }

      return { ...prev, bookmarks: newBookmarks };
    });
  };

  const handleCreateFolder = () => {
    setData((prev) => {
      const folder: Bookmark = {
        id: `folder-${Date.now()}`,
        name: 'New Folder',
        type: 'folder',
        position: {
          x: 40 + (prev.bookmarks.length % 8) * 90,
          y: 40 + Math.floor(prev.bookmarks.length / 8) * 110,
        },
        children: [],
      };
      return {
        ...prev,
        bookmarks: [...prev.bookmarks, folder],
      };
    });
  };

  const handleCreateSubfolder = (parentId: string) => {
    setData((prev) => {
      const newFolder: Bookmark = {
        id: `folder-${Date.now()}`,
        name: 'New Folder',
        type: 'folder',
        position: { x: 0, y: 0 },
        children: [],
      };

      function addToParent(items: Bookmark[]): Bookmark[] {
        return items.map((item): Bookmark => {
          if (item.id === parentId && item.type === 'folder') {
            return {
              ...item,
              children: [...(item.children || []), newFolder],
            };
          }
          if (item.children) {
            return { ...item, children: addToParent(item.children) };
          }
          return item;
        });
      }

      return {
        ...prev,
        bookmarks: addToParent(prev.bookmarks),
      };
    });
  };

  // 文件夹窗口内拖拽：把图标（书签或子文件夹）移入目标子文件夹
  const handleMoveToFolder = (sourceId: string, targetFolderId: string) => {
    setData((prev) => {
      let moved: Bookmark | undefined;

      function removeFromTree(items: Bookmark[]): Bookmark[] {
        const result: Bookmark[] = [];
        for (const item of items) {
          if (item.id === sourceId) {
            moved = item;
            continue;
          }
          if (item.children) {
            result.push({ ...item, children: removeFromTree(item.children) });
          } else {
            result.push(item);
          }
        }
        return result;
      }

      const bookmarks = removeFromTree(prev.bookmarks);
      if (!moved || moved.id === targetFolderId) return prev;

      // 把图标加入目标文件夹；若目标已被移除（源是目标祖先 → 防循环），放弃
      let added = false;
      function addToFolder(items: Bookmark[]): Bookmark[] {
        return items.map((item): Bookmark => {
          if (item.id === targetFolderId && item.type === 'folder') {
            added = true;
            return { ...item, children: [...(item.children || []), moved!] };
          }
          if (item.children) {
            return { ...item, children: addToFolder(item.children) };
          }
          return item;
        });
      }

      const newBookmarks = addToFolder(bookmarks);
      if (!added) return prev;
      return { ...prev, bookmarks: newBookmarks };
    });
  };

  const handleToggleDock = (id: string) => {
    setData((prev) => {
      const isInDock = prev.dockItems.includes(id);
      if (isInDock) {
        return { ...prev, dockItems: prev.dockItems.filter((item) => item !== id) };
      } else {
        // 限制 Dock 最多 10 个
        if (prev.dockItems.length >= 10) {
          return prev;
        }
        return { ...prev, dockItems: [...prev.dockItems, id] };
      }
    });
  };

  const handleImportBookmarks = (bookmarks: Bookmark[]) => {
    setData((prev) => {
      const offsetX = 40;
      const offsetY = 40;
      const startIdx = prev.bookmarks.length;
      const positioned = bookmarks.map((b, i) => ({
        ...b,
        position: {
          x: offsetX + ((startIdx + i) % 8) * 90,
          y: offsetY + Math.floor((startIdx + i) / 8) * 110,
        },
      }));
      return {
        ...prev,
        bookmarks: [...prev.bookmarks, ...positioned],
      };
    });
    setShowImporter(false);
  };

  const handleExportData = () => {
    const payload: DesktopData = {
      ...data,
      settings: { ...data.settings, customWallpaper: undefined },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webdesk-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDark = data.settings.theme === 'dark';

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative w-full h-full overflow-hidden wallpaper-transition" style={getBackgroundStyle(data.settings)}>
        {/* 计数器 — 显示一级文件夹和总书签数 */}
        <div className={`fixed top-3 right-3 z-50 px-2 py-1 rounded-lg text-[10px] font-mono opacity-40 pointer-events-none ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-800'}`}>
          Bookmarks: {data.bookmarks.length} | Folders: {data.bookmarks.filter(b => b.type === 'folder').length}        </div>

        {/* 全局搜索 */}
        <SearchBar
          bookmarks={data.bookmarks}
          isDark={isDark}
          onOpenLink={(url) => window.open(url, '_blank')}
          onOpenFolder={openFolderWindow}
        />

        {/* 桌面小组件 */}
        {widgets.clock.enabled && (
          <ClockWidget
            state={widgets.clock}
            isDark={isDark}
            accentColor={data.settings.accentColor}
            onPositionChange={(pos) => setWidgets((prev) => ({ ...prev, clock: { ...prev.clock, ...pos } }))}
            onClose={() => setWidgets((prev) => ({ ...prev, clock: { ...prev.clock, enabled: false } }))}
          />
        )}
        {widgets.todo.enabled && (
          <TodoWidget
            state={widgets.todo}
            isDark={isDark}
            accentColor={data.settings.accentColor}
            onPositionChange={(pos) => setWidgets((prev) => ({ ...prev, todo: { ...prev.todo, ...pos } }))}
            onItemsChange={(items) => setWidgets((prev) => ({ ...prev, todo: { ...prev.todo, items } }))}
            onClose={() => setWidgets((prev) => ({ ...prev, todo: { ...prev.todo, enabled: false } }))}
          />
        )}

        {/* 云端更新提示 */}
        {sync.pendingRemote && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] animate-window-enter">
            <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${isDark ? 'bg-gray-800/95 border-white/10 text-white' : 'bg-white/95 border-white/50 text-gray-800'}`}>
              <span className="text-sm">Cloud data updated. Load it?</span>
              <button
                onClick={sync.applyPendingRemote}
                className="px-3 py-1.5 rounded-lg text-xs text-white hover:brightness-110 transition-all"
                style={{ backgroundColor: data.settings.accentColor }}
              >
                Load
              </button>
              <button
                onClick={sync.dismissPendingRemote}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                Dismiss
              </button>            </div>
          </div>
        )}

        {/* 桌面图标 */}
        <Desktop
          bookmarks={data.bookmarks}
          isDark={isDark}
          onDelete={handleDeleteBookmark}
          onToggleDock={handleToggleDock}
          onOpenFolder={openFolderWindow}
          onRename={handleRename}
          onOpenMoveDialog={(itemId, itemName) => setMoveDialog({ itemId, itemName })}
          dockItems={data.dockItems}
        />

        {/* Dock 栏 */}
        {data.settings.showDock && (
          <Dock
            bookmarks={data.bookmarks.filter((b) => data.dockItems.includes(b.id))}
            openFolders={openFolders}
            showSettings={showSettings}
            isDark={isDark}
            accentColor={data.settings.accentColor}
            onSettingsClick={openSettingsWindow}
            onAddClick={() => setShowAddDialog(true)}
            onImportClick={() => setShowImporter(true)}
            onCreateFolder={handleCreateFolder}
            onOpenFolder={openFolderWindow}
          />
        )}

        {/* 设置窗口 */}
        {showSettings && (
          <SettingsWindow
            settings={data.settings}
            onSettingsChange={(settings) => setData((prev) => ({ ...prev, settings }))}
            onClose={() => {
              setShowSettings(false);
              setWindowStack((prev) => prev.filter((id) => id !== 'settings'));
            }}
            isDark={isDark}
            zIndex={40 + windowStack.indexOf('settings')}
            onFocus={() => focusWindow('settings')}
            syncConfig={syncConfig}
            onSyncConfigChange={setSyncConfig}
            syncStatus={sync.status}
            onTestConnection={sync.testConnection}
            onManualSync={() => sync.manualSync()}
            widgets={widgets}
            onWidgetsChange={setWidgets}
            onExportData={handleExportData}
          />
        )}

        {/* 导入书签 */}
        {showImporter && (
          <BookmarkImporter
            onImport={handleImportBookmarks}
            onClose={() => setShowImporter(false)}
            isDark={isDark}
          />
        )}

        {/* 文件夹窗口 */}
        {openFolders.map((folderId, idx) => (
          <FolderWindow
            key={folderId}
            folderId={folderId}
            allBookmarks={data.bookmarks}
            isDark={isDark}
            accentColor={data.settings.accentColor}
            zIndex={40 + windowStack.indexOf(folderId)}
            stackIndex={idx}
            onFocus={() => focusWindow(folderId)}
            onClose={() => {
              setOpenFolders((prev) => prev.filter((id) => id !== folderId));
              setWindowStack((prev) => prev.filter((id) => id !== folderId));
            }}
            onOpenFolder={openFolderWindow}
            onOpenLink={(url) => window.open(url, '_blank')}
            onDelete={handleDeleteBookmark}
            onRename={handleRename}
            onCreateSubfolder={handleCreateSubfolder}
            onMoveToDesktop={handleMoveToDesktop}
            onMoveToFolder={handleMoveToFolder}
          />
        ))}

        {/* 移动到文件夹对话框（桌面图标右键） */}
        {moveDialog && (
          <MoveToFolderDialog
            itemId={moveDialog.itemId}
            itemName={moveDialog.itemName}
            allBookmarks={data.bookmarks}
            isDark={isDark}
            accentColor={data.settings.accentColor}
            onSelect={(targetId) => {
              handleMoveToFolder(moveDialog.itemId, targetId);
              setMoveDialog(null);
            }}
            onClose={() => setMoveDialog(null)}
          />
        )}

        {/* 添加书签弹窗 */}
        {showAddDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddDialog(false)}>
            <div
              className={`rounded-2xl p-6 w-96 shadow-2xl ${
                isDark ? 'bg-gray-800/90 text-white border border-white/10' : 'bg-white/90 text-gray-800 border border-white/50'
              } backdrop-blur-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">Add Bookmark</h2>
              <input
                type="text"
                placeholder="Name (e.g. GitHub)"
                value={newBookmark.name}
                onChange={(e) => setNewBookmark({ ...newBookmark, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('url-input')?.focus()}
                className={`w-full p-3 rounded-xl mb-3 text-sm outline-none transition-all border ${
                  isDark
                    ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-300'
                }`}
              />
              <input
                id="url-input"
                type="text"
                placeholder="URL (e.g. github.com)"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                className={`w-full p-3 rounded-xl mb-4 text-sm outline-none transition-all border ${
                  isDark
                    ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-300'
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBookmark}
                  className="px-4 py-2 rounded-xl text-sm text-white hover:brightness-110 transition-all"
                  style={{ backgroundColor: data.settings.accentColor }}
                >
                  Add
                </button>              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}

function getBackgroundStyle(settings: DesktopSettings): React.CSSProperties {
  const { theme, wallpaper, customWallpaper } = settings;
  const isDark = theme === 'dark';

  // 自定义图片壁纸
  if (wallpaper === 'custom' && customWallpaper) {
    return {
      backgroundImage: `url(${customWallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  // mesh: 多 radial-gradient 交织，有复杂网格感
  if (wallpaper === 'mesh') {
    if (isDark) {
      return {
        background: `
          radial-gradient(at 0% 0%, hsla(260,60%,22%,1) 0, transparent 50%),
          radial-gradient(at 50% 0%, hsla(225,50%,28%,1) 0, transparent 50%),
          radial-gradient(at 100% 0%, hsla(340,55%,22%,1) 0, transparent 50%),
          radial-gradient(at 0% 100%, hsla(260,50%,18%,1) 0, transparent 50%),
          radial-gradient(at 100% 100%, hsla(200,40%,20%,1) 0, transparent 50%),
          hsla(253,16%,7%,1)
        `,
      };
    }
    return {
      background: `
        radial-gradient(at 0% 0%, hsla(260,80%,93%,1) 0, transparent 50%),
        radial-gradient(at 50% 0%, hsla(225,70%,92%,1) 0, transparent 50%),
        radial-gradient(at 100% 0%, hsla(340,70%,93%,1) 0, transparent 50%),
        radial-gradient(at 0% 100%, hsla(260,60%,94%,1) 0, transparent 50%),
        radial-gradient(at 100% 100%, hsla(200,60%,93%,1) 0, transparent 50%),
        hsla(30,30%,96%,1)
      `,
    };
  }

  // gradient: 简洁蓝紫线性渐变
  if (wallpaper === 'gradient') {
    if (isDark) {
      return {
        background: 'linear-gradient(135deg, hsla(222,35%,16%,1) 0%, hsla(260,30%,12%,1) 100%)',
      };
    }
    return {
      background: 'linear-gradient(135deg, hsla(220,60%,95%,1) 0%, hsla(260,50%,92%,1) 100%)',
    };
  }

  // dawn: 暖色调，黎明感
  if (wallpaper === 'dawn') {
    if (isDark) {
      return {
        background: `
          radial-gradient(at 0% 100%, hsla(25,55%,22%,1) 0, transparent 50%),
          radial-gradient(at 100% 0%, hsla(340,45%,20%,1) 0, transparent 50%),
          radial-gradient(at 50% 50%, hsla(280,30%,12%,1) 0, transparent 50%),
          hsla(253,16%,7%,1)
        `,
      };
    }
    return {
      background: `
        radial-gradient(at 0% 100%, hsla(25,85%,92%,1) 0, transparent 50%),
        radial-gradient(at 100% 0%, hsla(340,75%,92%,1) 0, transparent 50%),
        radial-gradient(at 50% 50%, hsla(280,50%,95%,1) 0, transparent 50%),
        hsla(30,30%,96%,1)
      `,
    };
  }

  // default: 兜底，与当前默认保持一致
  if (isDark) {
    return {
      background: `
        radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
        radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
        radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%),
        hsla(253,16%,7%,1)
      `,
    };
  }
  return {
    background: `
      radial-gradient(at 0% 0%, hsla(340,70%,93%,1) 0, transparent 50%),
      radial-gradient(at 50% 0%, hsla(220,70%,93%,1) 0, transparent 50%),
      radial-gradient(at 100% 0%, hsla(160,60%,92%,1) 0, transparent 50%),
      hsla(30,30%,96%,1)
    `,
  };
}

export default App;
