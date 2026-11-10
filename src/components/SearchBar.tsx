import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Folder, ExternalLink, CornerDownLeft } from 'lucide-react';
import type { Bookmark } from '../types';
import { FaviconImg } from './FaviconImg';
import { glassBlur, menuSurface } from '../lib/surfaces';

interface SearchBarProps {
  bookmarks: Bookmark[];
  isDark: boolean;
  accentColor: string;
  onOpenLink: (url: string) => void;
  onOpenFolder: (id: string) => void;
}

interface SearchHit {
  bookmark: Bookmark;
  path: string;
}

/** 最多展示多少条；页面里还有 "1/12" 的位置提示，改这个要同步改不到的地方。 */
const MAX_RESULTS = 12;

function flatten(items: Bookmark[], path: string, out: SearchHit[]) {
  for (const b of items) {
    out.push({ bookmark: b, path });
    if (b.children) flatten(b.children, path ? `${path} / ${b.name}` : b.name, out);
  }
}

/**
 * 把命中片段切出来高亮。
 * 只高亮名称/备注里第一处命中——全量标记会让下拉看起来很吵。
 */
function Highlight({ text, query, isDark }: { text: string; query: string; isDark: boolean }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const at = text.toLowerCase().indexOf(q);
  if (at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark
        className={`rounded-[3px] px-0.5 ${isDark ? 'bg-white/25 text-white' : 'bg-black/15 text-gray-900'}`}
      >
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function SearchBar({ bookmarks, isDark, accentColor, onOpenLink, onOpenFolder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  /** 键盘选中的下标；-1 表示还没用方向键选过（此时回车打开第一条）。 */
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allHits = useMemo(() => {
    const out: SearchHit[] = [];
    flatten(bookmarks, '', out);
    return out;
  }, [bookmarks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allHits
      .filter(
        (h) =>
          h.bookmark.name.toLowerCase().includes(q) ||
          h.bookmark.url?.toLowerCase().includes(q) ||
          h.bookmark.note?.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS);
  }, [allHits, query]);

  const open = query.trim().length > 0;

  // 查询变了就把选中位置重置，否则会停在上一次的结果下标上
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handlePick = useCallback(
    (h: SearchHit) => {
      if (h.bookmark.type === 'folder') {
        onOpenFolder(h.bookmark.id);
      } else if (h.bookmark.url) {
        onOpenLink(h.bookmark.url);
      }
      setQuery('');
      setFocused(false);
      inputRef.current?.blur();
    },
    [onOpenFolder, onOpenLink]
  );

  /** 键盘操作集中在这里：↑↓ 选择、Enter 打开、Esc 收起。 */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
      } else {
        setFocused(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // 从"未选中"按下 ↑ 时落到最后一条，符合列表导航的直觉
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex >= 0 ? activeIndex : 0];
      if (target) handlePick(target);
    }
  };

  // 全局快捷键：Ctrl/Cmd + K 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      // 输入框失焦时按 / 也能唤起，和 GitHub、Linear 的习惯一致
      if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // 键盘选中项滚进可视区，否则结果多于可视高度时看不到自己在选哪条
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const inputClass = isDark
    ? 'bg-black/25 border-white/15 text-white placeholder:text-white/40 focus:border-white/30'
    : 'bg-white/60 border-black/10 text-gray-800 placeholder:text-gray-400 focus:border-black/20';

  // 只负责自身布局：右上角的定位交给 App 里那一行，否则宽度变化会盖住统计
  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Search bookmarks…"
          role="combobox"
          aria-expanded={focused && open}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-hit-${activeIndex}` : undefined}
          className={`w-44 pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all border backdrop-blur-xl ${inputClass}`}
        />
        {/* 快捷键提示：只在没输入时显示，输入后让位给内容 */}
        {!query && (
          <kbd
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono pointer-events-none border ${
              isDark ? 'bg-white/10 border-white/15 text-white/50' : 'bg-black/5 border-black/10 text-gray-500'
            }`}
          >
            ⌘K
          </kbd>
        )}
      </div>

      {focused && open && (
        <div
          id="search-results"
          role="listbox"
          ref={listRef}
          className={`absolute top-10 right-0 w-80 max-h-[60vh] overflow-y-auto glass-scroll rounded-2xl shadow-2xl ${glassBlur} ${menuSurface(isDark)}`}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs opacity-50">No matching bookmarks</p>
          ) : (
            results.map((h, i) => {
              const selected = i === activeIndex;
              return (
                <button
                  key={h.bookmark.id}
                  id={`search-hit-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => handlePick(h)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    selected ? '' : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                  // 选中行用 accent 着色：这是 accent 该出现的地方（强调当前项），不是正文
                  style={selected ? { backgroundColor: `${accentColor}22`, boxShadow: `inset 2px 0 0 ${accentColor}` } : undefined}
                >
                  <span
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: h.bookmark.type === 'folder' ? 'rgba(128,128,128,0.15)' : 'rgba(128,128,128,0.1)',
                    }}
                  >
                    {h.bookmark.type === 'folder' ? (
                      <Folder size={14} className="opacity-70" />
                    ) : (
                      <FaviconImg
                        pageUrl={h.bookmark.url}
                        name={h.bookmark.name}
                        fallbackSrc={h.bookmark.favicon}
                        className="w-5 h-5 rounded"
                        letterClassName="text-xs font-bold opacity-70"
                      />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm truncate">
                      <Highlight text={h.bookmark.note || h.bookmark.name} query={query} isDark={isDark} />
                    </span>
                    {/* 备注优先于路径：搜到一条待看时，“为什么留着”比所在文件夹更有用 */}
                    {(h.bookmark.note || h.path) && (
                      <span className="block text-[10px] opacity-40 truncate">
                        {h.bookmark.note ? h.bookmark.name : h.path}
                      </span>
                    )}
                  </span>
                  {selected ? (
                    <CornerDownLeft size={11} className="shrink-0 opacity-60" />
                  ) : (
                    h.bookmark.type === 'link' && <ExternalLink size={11} className="opacity-30 shrink-0" />
                  )}
                </button>
              );
            })
          )}

          {/* 底部提示：告诉用户键盘能用，也让 "1/12" 的截断可见 */}
          <div
            className={`sticky bottom-0 flex items-center justify-between px-3.5 py-1.5 text-[10px] opacity-40 border-t ${
              isDark ? 'border-white/10 bg-[#2a2a2e]/90' : 'border-black/5 bg-white/90'
            }`}
          >
            <span>↑↓ select · ↵ open · esc clear</span>
            <span>
              {results.length === MAX_RESULTS ? `${MAX_RESULTS}+` : results.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
