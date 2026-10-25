import { useLayoutEffect, useRef, useState } from 'react';
import { glassBlur, menuSurface } from '../lib/surfaces';

interface FloatingMenuProps {
  x: number;
  y: number;
  isDark: boolean;
  minWidth?: number;
  zIndex?: number;
  children: React.ReactNode;
}

/**
 * 以点击处为左上角的浮层菜单。
 *
 * 之前直接用 clientX/clientY：在屏幕右边缘或下边缘右键，菜单会有一半跑出视口。
 * 这里在绘制前量一次自身尺寸，把坐标夹回视口内（右下角改为向左上展开）。
 */
export function FloatingMenu({ x, y, isDark, minWidth = 160, zIndex = 70, children }: FloatingMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y, measured: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    setPos({
      x: Math.max(gap, Math.min(x, window.innerWidth - rect.width - gap)),
      y: Math.max(gap, Math.min(y, window.innerHeight - rect.height - gap)),
      measured: true,
    });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className={`fixed rounded-xl shadow-2xl overflow-hidden py-1 ${glassBlur} ${menuSurface(isDark)}`}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex,
        minWidth,
        // 首帧先量尺寸再显示，避免看到菜单从旧坐标跳到新坐标
        visibility: pos.measured ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
}
