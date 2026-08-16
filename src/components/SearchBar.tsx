import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Folder, ExternalLink } from 'lucide-react';
import type { Bookmark } from '../types';

interface SearchBarProps {
  bookmarks: Bookmark[];
  isDark: boolean;
  onOpenLink: (url: string) => void;
  onOpenFolder: (id: string) => void;
}

interface SearchHit {
  bookmark: Bookmark;
  path: string;
}

function flatten(items: Bookmark[], path: string, out: SearchHit[]) {
  for (const b of items) {
    out.push({ bookmark: b, path });
    if (b.children) flatten(b.children, path ? `${path} / ${b.name}` : b.name, out);
  }
}

export function SearchBar({ bookmarks, isDark, onOpenLink, onOpenFolder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const allHits = useMemo(() => {
    const out: SearchHit[] = [];
    flatten(bookmarks, '', out);
    return out;
  }, [bookmarks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allHits.filter(
      (h) => h.bookmark.name.toLowerCase().includes(q) || h.bookmark.url?.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [allHits, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false);
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

  const handlePick = (h: SearchHit) => {
    if (h.bookmark.type === 'folder') {
      onOpenFolder(h.bookmark.id);
    } else if (h.bookmark.url) {
      onOpenLink(h.bookmark.url);
    }
    setQuery('');
    setFocused(false);
  };

  const inputClass = isDark
    ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
    : 'bg-white/60 border-white/70 text-gray-800 placeholder:text-gray-400 focus:border-gray-300';

  return (
    <div ref={boxRef} className="fixed top-3 right-[200px] z-50">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search bookmarks…"
          className={`w-44 pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all border backdrop-blur-xl ${inputClass}`}
        />
      </div>

      {focused && query.trim() && (
        <div
          className={`absolute top-10 right-0 w-80 rounded-2xl shadow-2xl border backdrop-blur-2xl overflow-hidden ${
            isDark ? 'bg-gray-800/90 border-white/10 text-white' : 'bg-white/95 border-white/50 text-gray-800'
          }`}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs opacity-50">No matching bookmarks</p>
          ) : (
            results.map((h) => (
              <button
                key={h.bookmark.id}
                onClick={() => handlePick(h)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <span
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: h.bookmark.type === 'folder' ? 'rgba(128,128,128,0.15)' : 'rgba(128,128,128,0.1)',
                  }}
                >
                  {h.bookmark.type === 'folder' ? (
                    <Folder size={14} className="opacity-70" />
                  ) : h.bookmark.favicon ? (
                    <img src={h.bookmark.favicon} alt="" className="w-5 h-5 rounded" draggable={false} />
                  ) : (
                    <span className="text-xs font-bold opacity-70">{h.bookmark.name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{h.bookmark.name}</span>
                  {h.path && (
                    <span className="block text-[10px] opacity-40 truncate">{h.path}</span>
                  )}
                </span>
                {h.bookmark.type === 'link' && <ExternalLink size={11} className="opacity-30 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
