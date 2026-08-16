import { useState } from 'react';
import { CheckSquare, Plus, X } from 'lucide-react';
import type { TodoItem, WidgetState } from '../../types';
import { useWidgetDrag } from '../../hooks/useWidgetDrag';

interface TodoWidgetProps {
  state: WidgetState & { items: TodoItem[] };
  isDark: boolean;
  accentColor: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onItemsChange: (items: TodoItem[]) => void;
  onClose: () => void;
}

export function TodoWidget({ state, isDark, accentColor, onPositionChange, onItemsChange, onClose }: TodoWidgetProps) {
  const [input, setInput] = useState('');
  const { position, onPointerDown, onPointerMove, onPointerUp } = useWidgetDrag(
    { x: state.x, y: state.y },
    onPositionChange,
    260,
    240
  );

  const addItem = () => {
    const text = input.trim();
    if (!text) return;
    onItemsChange([...state.items, { id: `todo-${Date.now()}`, text, done: false }]);
    setInput('');
  };

  const toggleItem = (id: string) => {
    onItemsChange(state.items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  };

  const removeItem = (id: string) => {
    onItemsChange(state.items.filter((it) => it.id !== id));
  };

  return (
    <div
      className={`fixed z-30 select-none backdrop-blur-2xl border rounded-3xl shadow-2xl transition-colors ${
        isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-white/60 border-white/70 text-gray-800'
      }`}
      style={{ left: position.x, top: position.y, width: 260 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex items-center justify-between px-5 pt-4 cursor-move">
        <div className="flex items-center gap-1.5 opacity-40">
          <CheckSquare size={11} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Todo</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-default"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X size={12} />
        </button>
      </div>

      <div className="px-5 pb-5">
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="添加待办…"
            className={`flex-1 min-w-0 px-3 py-1.5 rounded-xl text-sm outline-none transition-all border ${
              isDark
                ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
                : 'bg-white/50 border-white/60 text-gray-800 placeholder:text-gray-400 focus:border-gray-300'
            }`}
          />
          <button
            onClick={addItem}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-white hover:brightness-110 transition-all cursor-default"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-3 space-y-1 max-h-40 overflow-y-auto pr-1">
          {state.items.length === 0 && (
            <p className="text-xs opacity-40 text-center py-2">暂无待办</p>
          )}
          {state.items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-black/5 transition-colors"
              style={isDark ? { backgroundColor: 'rgba(255,255,255,0.04)' } : { backgroundColor: 'rgba(0,0,0,0.03)' }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-all cursor-default"
                style={{
                  borderColor: accentColor,
                  backgroundColor: item.done ? accentColor : 'transparent',
                }}
              >
                {item.done && <span className="text-white text-[9px] leading-none">✓</span>}
              </button>
              <span
                className={`flex-1 min-w-0 text-sm truncate transition-all ${
                  item.done ? 'line-through opacity-40' : ''
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-50 hover:opacity-100 hover:bg-red-500/10 transition-all cursor-default"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
