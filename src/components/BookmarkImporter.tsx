import { useState, useRef, useEffect, useCallback } from 'react';
import type { Bookmark } from '../types';
import { X, Upload, Check, FileText, Folder } from 'lucide-react';

interface BookmarkImporterProps {
  onImport: (bookmarks: Bookmark[]) => void;
  onClose: () => void;
  isDark: boolean;
}

export function BookmarkImporter({ onImport, onClose, isDark }: BookmarkImporterProps) {
  const [parsedBookmarks, setParsedBookmarks] = useState<Bookmark[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 全局阻止浏览器默认的文件拖放行为（防止拖到窗口上直接打开文件）
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleFile = useCallback((file: File) => {
    setIsParsing(true);
    setParseError(null);
    setParsedBookmarks([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const html = e.target?.result as string;
        if (!html || html.trim().length === 0) {
          setParseError('File content is empty');
          setIsParsing(false);
          return;
        }
        const bookmarks = parseBookmarksHtml(html);
        setParsedBookmarks(bookmarks);
        if (bookmarks.length === 0) {
          setParseError('No bookmarks found. Please check the file format.');
        }
      } catch (err) {
        setParseError('Parse failed: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the file');
      setIsParsing(false);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setParseError('Only .html / .htm bookmark files are supported');
      return;
    }

    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 只有当鼠标真正离开 dropzone（不是进入子元素）时才取消高亮
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleImport = () => {
    if (parsedBookmarks.length > 0) {
      onImport(parsedBookmarks);
    }
  };

  // 递归收集所有链接用于预览
  function collectLinks(items: Bookmark[]): { name: string; url?: string; type: 'link' | 'folder' }[] {
    const result: { name: string; url?: string; type: 'link' | 'folder' }[] = [];
    for (const item of items) {
      if (item.type === 'folder') {
        result.push({ name: item.name, type: 'folder' });
        if (item.children) {
          result.push(...collectLinks(item.children));
        }
      } else {
        result.push({ name: item.name, url: item.url, type: 'link' });
      }
    }
    return result;
  }

  const previewLinks = parsedBookmarks.length > 0 ? collectLinks(parsedBookmarks) : [];
  const linkCount = previewLinks.filter((l) => l.type === 'link').length;
  const folderCount = previewLinks.filter((l) => l.type === 'folder').length;

  const bgClass = isDark ? 'bg-gray-800/90 border-white/10 text-white' : 'bg-white/90 border-white/50 text-gray-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`rounded-2xl p-6 w-[560px] max-h-[85vh] flex flex-col shadow-2xl backdrop-blur-xl border ${bgClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            Import Bookmarks
          </h2>          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 拖放区域 */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : isDark
              ? 'border-white/15 hover:border-white/30'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium mb-1">Click to select or drag &amp; drop a browser-exported bookmarks HTML file</p>
          <p className="text-xs opacity-50">Supports Chrome / Edge / Firefox / Safari bookmark export formats</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="text/html,.html,.htm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // 重置 input 值，允许重复选择同一文件
              e.target.value = '';
            }}
          />
        </div>

        {/* 错误提示 */}
        {parseError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {parseError}
          </div>
        )}

        {/* 解析状态 */}
        {isParsing && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm">Parsing…</span>
          </div>
        )}

        {/* 解析结果预览 */}
        {parsedBookmarks.length > 0 && !isParsing && (
          <div className="flex-1 overflow-hidden mb-4">
            <p className="text-sm mb-2 font-medium">
              Found {linkCount} links{folderCount > 0 ? `, ${folderCount} folders` : ''}
              {folderCount > 0 && ' (folder structure preserved)'}
            </p>
            <div className={`max-h-52 overflow-y-auto rounded-xl p-2 space-y-1 ${isDark ? 'bg-black/20' : 'bg-black/5'}`}>
              {previewLinks.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 py-1.5 px-2 text-sm rounded-lg hover:bg-white/5"
                  style={{ paddingLeft: item.type === 'link' ? '24px' : '12px' }}
                >
                  {item.type === 'folder' ? (
                    <Folder size={14} className="shrink-0 opacity-60" />
                  ) : (
                    <Check size={14} className="text-green-500 shrink-0" />
                  )}
                  <span className="truncate font-medium">{item.name}</span>
                  {item.type === 'link' && item.url && (
                    <span className="text-xs opacity-40 truncate ml-auto">{(() => { try { return new URL(item.url).hostname; } catch { return ''; } })()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 mt-auto pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedBookmarks.length === 0}
            className="px-4 py-2 rounded-xl text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import {parsedBookmarks.length > 0 ? `(${parsedBookmarks.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseBookmarksHtml(html: string): Bookmark[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let index = 0;
  const bookmarks: Bookmark[] = [];

  // 最简单的平铺提取：遍历所有 <A> 标签，不再关心层级
  const links = doc.querySelectorAll('a[href]');

  for (const a of links) {
    const url = a.getAttribute('href');
    const name = a.textContent?.trim() || 'Untitled';

    // 过滤无效链接
    if (!url || url.startsWith('javascript:') || url === '' || url.startsWith('place:') || url.startsWith('about:')) {
      continue;
    }
    // 过滤浏览器内置链接
    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('opera://')) {
      continue;
    }

    bookmarks.push({
      id: `link-${Date.now()}-${index++}`,
      name,
      type: 'link',
      url,
      position: { x: 0, y: 0 },
    });
  }

  // 给所有书签分配不重叠的桌面位置
  return bookmarks.map((b, i) => ({
    ...b,
    position: {
      x: 40 + (i % 8) * 90,
      y: 40 + Math.floor(i / 8) * 110,
    },
  }));
}
