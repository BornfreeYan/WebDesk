import { useRef, useState } from 'react';

/** 通用拖拽逻辑：按下标题栏/卡片拖动，限制在视口内，释放后回调新位置 */
export function useWidgetDrag(
  initial: { x: number; y: number },
  onPositionChange: (pos: { x: number; y: number }) => void,
  width = 260,
  height = 200
) {
  const [position, setPosition] = useState(initial);
  const dragStart = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const x = Math.max(8, Math.min(window.innerWidth - width - 8, e.clientX - dragStart.current.offsetX));
    const y = Math.max(8, Math.min(window.innerHeight - height - 8, e.clientY - dragStart.current.offsetY));
    setPosition({ x, y });
  };

  const onPointerUp = () => {
    if (dragStart.current) {
      dragStart.current = null;
      onPositionChange(position);
    }
  };

  return { position, onPointerDown, onPointerMove, onPointerUp };
}
