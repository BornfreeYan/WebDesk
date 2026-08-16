import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { WidgetState } from '../../types';
import { useWidgetDrag } from '../../hooks/useWidgetDrag';

interface ClockWidgetProps {
  state: WidgetState;
  isDark: boolean;
  accentColor: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClose: () => void;
}

export function ClockWidget({ state, isDark, accentColor, onPositionChange, onClose }: ClockWidgetProps) {
  const [now, setNow] = useState(() => new Date());
  const { position, onPointerDown, onPointerMove, onPointerUp } = useWidgetDrag(
    { x: state.x, y: state.y },
    onPositionChange,
    240,
    130
  );

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('en-GB', { hour12: false });
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div
      className={`fixed z-30 select-none cursor-move backdrop-blur-2xl border rounded-3xl p-5 shadow-2xl transition-colors ${
        isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-white/60 border-white/70 text-gray-800'
      }`}
      style={{ left: position.x, top: position.y, width: 240, height: 130 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-default"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Clock size={13} className="opacity-0" />
        <span className={`absolute text-xs font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>✕</span>
      </button>

      <div className="flex items-center gap-1.5 mb-2 opacity-40">
        <Clock size={11} />
        <span className="text-[10px] uppercase tracking-widest font-bold">Clock</span>
      </div>

      <div className="text-4xl font-light tabular-nums tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </div>
      <div className="mt-1.5 text-xs opacity-60">{date}</div>

      <div className="mt-2.5 h-0.5 w-12 rounded-full transition-colors" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
    </div>
  );
}
