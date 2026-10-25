import { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';
import { glassBlur, menuSurface } from '../lib/surfaces';

interface UndoToastProps {
  message: string;
  isDark: boolean;
  /** 自动消失毫秒数；悬停时不走，留给用户点撤销。 */
  duration?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

/** 删除后的撤销条：贴在 Dock 上方居中，不遮挡桌面内容。 */
export function UndoToast({ message, isDark, duration = 6000, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[75] animate-window-enter">
      <div
        className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl shadow-2xl ${glassBlur} ${menuSurface(isDark)}`}
        role="status"
      >
        <span className="text-xs whitespace-nowrap">{message}</span>
        <button
          onClick={onUndo}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isDark ? 'hover:bg-white/15' : 'hover:bg-black/10'
          }`}
        >
          <Undo2 size={12} />
          Undo
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity ${
            isDark ? 'hover:bg-white/15' : 'hover:bg-black/10'
          }`}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
