import { useState } from 'react';
import type { Bookmark } from '../types';
import { Settings, Plus, Upload, Folder } from 'lucide-react';
import { openBookmarkUrl } from '../lib/openUrl';
import { FaviconImg } from './FaviconImg';

interface DockProps {
  bookmarks: Bookmark[];
  openFolders: string[];
  showSettings: boolean;
  isDark: boolean;
  accentColor: string;
  onSettingsClick: () => void;
  onAddClick: () => void;
  onImportClick: () => void;
  onCreateFolder: () => void;
  onOpenFolder: (id: string) => void;
}

export function Dock({ bookmarks, openFolders, showSettings, isDark, accentColor, onSettingsClick, onAddClick, onImportClick, onCreateFolder, onOpenFolder }: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const allItems = [
    { type: 'action' as const, icon: <Plus size={20} strokeWidth={2.5} />, label: 'Add', onClick: onAddClick },
    { type: 'action' as const, icon: <Folder size={20} strokeWidth={2.5} />, label: 'New Folder', onClick: onCreateFolder },
    { type: 'action' as const, icon: <Upload size={20} strokeWidth={2.5} />, label: 'Import', onClick: onImportClick },
    { type: 'divider' as const },
    ...bookmarks.map((b) => ({ type: 'bookmark' as const, bookmark: b })),
    { type: 'divider' as const },
    { type: 'action' as const, icon: <Settings size={20} strokeWidth={2.5} />, label: 'Settings', onClick: onSettingsClick, isOpen: showSettings },
  ];

  // 计算每个 item 的放大倍数：hovered 最大，相邻稍大，其余正常
  function getScale(idx: number): number {
    if (hoveredIndex === null) return 1;
    const dist = Math.abs(idx - hoveredIndex);
    if (dist === 0) return 1.35;
    if (dist === 1) return 1.12;
    if (dist === 2) return 1.04;
    return 1;
  }

  function getLift(idx: number): number {
    if (hoveredIndex === null) return 0;
    const dist = Math.abs(idx - hoveredIndex);
    if (dist === 0) return 18;
    if (dist === 1) return 8;
    if (dist === 2) return 3;
    return 0;
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`flex items-end gap-1 px-3 py-2.5 rounded-[24px] shadow-2xl transition-all ${
          isDark
            ? 'bg-white/10 backdrop-blur-2xl border border-white/10'
            : 'bg-white/40 backdrop-blur-2xl border border-white/60'
        }`}
      >
        {allItems.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div
                key={`divider-${idx}`}
                className={`w-px h-8 mx-1 self-center ${isDark ? 'bg-white/15' : 'bg-black/8'}`}
              />
            );
          }

          if (item.type === 'action') {
            const isHovered = hoveredIndex === idx;
            return (
              <DockItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                isDark={isDark}
                accentColor={accentColor}
                scale={getScale(idx)}
                lift={getLift(idx)}
                isHovered={isHovered}
                isOpen={'isOpen' in item ? item.isOpen : false}
                onClick={item.onClick}
                onHover={() => setHoveredIndex(idx)}
                onLeave={() => setHoveredIndex(null)}
              />
            );
          }

          // bookmark
          const b = item.bookmark;
          const isOpen = b.type === 'folder' && openFolders.includes(b.id);
          const isHovered = hoveredIndex === idx;

          return (
            <DockItem
              key={b.id}
              icon={<DockBookmarkIcon bookmark={b} isDark={isDark} />}
              label={b.name}
              isDark={isDark}
              accentColor={accentColor}
              scale={getScale(idx)}
              lift={getLift(idx)}
              isHovered={isHovered}
              isOpen={isOpen}
              onClick={() => {
                if (b.type === 'folder') {
                  onOpenFolder(b.id);
                } else if (b.url) {
                  openBookmarkUrl(b.url);
                }
              }}
              onHover={() => setHoveredIndex(idx)}
              onLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DockBookmarkIcon({ bookmark, isDark }: { bookmark: Bookmark; isDark: boolean }) {
  if (bookmark.type === 'folder') {
    return <Folder size={22} className={isDark ? 'text-white/70' : 'text-gray-500'} />;
  }
  return (
    <FaviconImg
      pageUrl={bookmark.url}
      name={bookmark.name}
      fallbackSrc={bookmark.favicon}
      className="w-6 h-6 rounded-md"
      letterClassName="text-base font-bold"
    />
  );
}

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  isDark: boolean;
  accentColor: string;
  scale: number;
  lift: number;
  isHovered: boolean;
  isOpen?: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

function DockItem({ icon, label, isDark, accentColor, scale, lift, isHovered, isOpen, onClick, onHover, onLeave }: DockItemProps) {
  // 边框颜色：默认半透明，hover 更明显
  const borderOpacity = isHovered ? '60' : '30';
  const borderColor = `${accentColor}${borderOpacity}`;

  return (
    <div className="relative flex flex-col items-center pb-1.5">
      <button
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-200 ease-out border ${
          isDark
            ? 'bg-white/5 hover:bg-white/15 text-white/90'
            : 'bg-white/60 hover:bg-white/80 text-gray-700'
        }`}
        style={{
          transform: `scale(${scale}) translateY(${-lift}px)`,
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          borderColor: borderColor,
        }}
      >
        {icon}
      </button>

      {/* 打开指示器小点 */}
      {isOpen && (
        <div
          className={`absolute bottom-0 w-1 h-1 rounded-full transition-opacity duration-200 ${
            isDark ? 'bg-white/70' : 'bg-black/40'
          }`}
        />
      )}

      {isHovered && (
        <span
          className={`absolute -top-9 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg transition-all ${
            isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-700'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
