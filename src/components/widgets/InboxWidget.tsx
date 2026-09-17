import { Inbox, Plus, Folder, X } from 'lucide-react';
import type { Bookmark, WidgetState } from '../../types';
import { useWidgetDrag } from '../../hooks/useWidgetDrag';
import { FaviconImg } from '../FaviconImg';

/** 组件上最多显示几条，完整列表点 “All” 打开文件夹窗口。 */
const VISIBLE_COUNT = 3;

interface InboxWidgetProps {
  state: WidgetState;
  items: Bookmark[];
  isDark: boolean;
  accentColor: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onOpenLink: (url: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onOpenAll: () => void;
  onClose: () => void;
}

export function InboxWidget({
  state,
  items,
  isDark,
  accentColor,
  onPositionChange,
  onOpenLink,
  onRemove,
  onAdd,
  onOpenAll,
  onClose,
}: InboxWidgetProps) {
  const { position, onPointerDown, onPointerMove, onPointerUp } = useWidgetDrag(
    { x: state.x, y: state.y },
    onPositionChange,
    280,
    220
  );

  const visible = items.slice(0, VISIBLE_COUNT);

  return (
    <div
      className={`fixed z-30 select-none backdrop-blur-2xl border rounded-3xl shadow-2xl transition-colors ${
        isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-white/60 border-white/70 text-gray-800'
      }`}
      style={{ left: position.x, top: position.y, width: 280 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex items-center justify-between px-5 pt-4 cursor-move">
        <div className="flex items-center gap-1.5 opacity-40">
          <Inbox size={11} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Inbox</span>
        </div>
        <div className="flex items-center gap-1.5">
          {items.length > 0 && (
            <span
              className="min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: accentColor }}
              title={`${items.length} item${items.length > 1 ? 's' : ''} waiting`}
            >
              {items.length}
            </span>
          )}
          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Hide Inbox widget"
            className="w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-default"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        {visible.length === 0 ? (
          <p className="text-xs opacity-40 text-center py-5 px-3 leading-relaxed">
            Nothing saved yet.
            <br />
            Paste a link to keep it for later.
          </p>
        ) : (
          <div className="space-y-1">
            {visible.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-2 px-2 py-1.5 rounded-xl transition-colors"
                style={
                  isDark
                    ? { backgroundColor: 'rgba(255,255,255,0.04)' }
                    : { backgroundColor: 'rgba(0,0,0,0.03)' }
                }
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* 有备注时备注当主行：它才是“为什么留着”的线索 */}
                <button
                  onClick={() => item.url && onOpenLink(item.url)}
                  title={item.note ? `${item.note}\n${item.url ?? ''}` : item.url}
                  className="flex items-start gap-2 flex-1 min-w-0 text-left cursor-default"
                >
                  <span className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center overflow-hidden mt-0.5">
                    <FaviconImg
                      pageUrl={item.url}
                      name={item.name}
                      fallbackSrc={item.favicon}
                      className="w-4 h-4 rounded"
                      letterClassName="text-[10px] font-bold opacity-70"
                    />
                  </span>
                  <span className="flex-1 min-w-0">
                    {/* 单行截断：行高固定后组件高度只随条目数变化，不会再撑长压住下方组件 */}
                    <span className="block text-xs truncate">{item.note || item.name}</span>
                    {item.note && (
                      <span className="block text-[10px] opacity-40 truncate mt-0.5">{item.name}</span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Remove from Inbox"
                  className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-50 hover:opacity-100 hover:bg-red-500/10 transition-all cursor-default mt-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onAdd}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 h-7 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-white hover:brightness-110 transition-all cursor-default"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add
          </button>
          <button
            onClick={onOpenAll}
            onPointerDown={(e) => e.stopPropagation()}
            title="Open the full Inbox"
            className={`h-7 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors cursor-default border ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/15'
                : 'bg-black/5 border-black/10 hover:bg-black/10'
            }`}
          >
            <Folder size={12} />
            All
          </button>
        </div>
      </div>
    </div>
  );
}
