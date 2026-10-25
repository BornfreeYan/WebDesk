import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { glassBlur, titleBarBorder, windowBodyTint, windowSurface } from '../lib/surfaces';

interface WindowProps {
  title: React.ReactNode;
  /** 初始位置；窗口内部自行维护拖拽后的位置，向上只上报最终位置。 */
  initialX: number;
  initialY: number;
  width: number;
  /** 用于把窗口拖拽限制在视口内。高度不固定（文件夹窗口随内容变化），所以由调用方给一个下限。 */
  minHeight?: number;
  isDark: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  /** 内容区是否可滚动；设置窗口自己管滚动时传 false。 */
  children: React.ReactNode;
}

/** 标题栏红点 + 拖拽 + 玻璃外观，文件夹窗与设置窗共用。 */
export function Window({
  title,
  initialX,
  initialY,
  width,
  minHeight = 160,
  isDark,
  zIndex,
  onFocus,
  onClose,
  children,
}: WindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击标题栏空白处才拖拽，不点击按钮
    const target = e.target as HTMLElement;
    if (target.closest('.window-title-bar') && !target.closest('.window-btn')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      // 用真实高度而不是写死的数字：窗口高度随内容变化，写死会把窗口拖出视口下沿
      const height = windowRef.current?.offsetHeight ?? minHeight;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragStart.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - Math.max(height, minHeight), e.clientY - dragStart.current.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, width, minHeight]);

  return (
    <div
      ref={windowRef}
      className="fixed animate-window-enter"
      style={{ left: position.x, top: position.y, width, zIndex }}
      onMouseDown={handleMouseDown}
      onClick={onFocus}
    >
      <div className={`rounded-2xl shadow-2xl shadow-black/20 overflow-hidden border ${glassBlur} ${windowSurface(isDark)}`}>
        <div
          className={`window-title-bar flex items-center gap-2 px-4 py-3 cursor-move border-b ${titleBarBorder(isDark)}`}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="window-btn group w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center cursor-default"
          >
            <X size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
          </button>
          <div className="ml-3 text-xs font-medium opacity-60 tracking-wide flex items-center gap-1.5 min-w-0">
            {title}
          </div>
        </div>

        <div className={`${windowBodyTint(isDark)}`}>{children}</div>
      </div>
    </div>
  );
}
