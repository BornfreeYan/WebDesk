/**
 * 玻璃表面口径。
 *
 * 之前每个窗口各写一套 `bg-gray-800/95`，95% 不透明的深色在暗色主题下就是一块黑板，
 * 和小组件的 `bg-white/10` 质感断层。这里按"表面离内容有多近"分三档统一管理：
 *
 * - window：文件夹窗 / 设置窗。文字密集，取中等透明度，保证可读性。
 * - menu：右键菜单 / 搜索下拉。浮在窗口内容之上，再实一点避免串色。
 * - dialog：模态弹窗。底下压着遮罩，不需要透过它看壁纸。
 *
 * 暗色档用**白色低透明度**而不是深灰：在深色壁纸上叠出来的是一层浅灰玻璃，
 * 白字仍有足够对比度，但不会再像纯黑。
 */

/** 所有窗口共用的模糊层：blur 足够大才像玻璃，saturate 让壁纸颜色透得更接近 macOS。 */
export const glassBlur = 'backdrop-blur-2xl backdrop-saturate-150';

export function windowSurface(isDark: boolean): string {
  return isDark
    ? 'bg-white/15 border-white/20 ring-1 ring-inset ring-white/10 text-white'
    : 'bg-white/60 border-white/60 ring-1 ring-inset ring-white/50 text-gray-800';
}

/** 标题栏分隔线：亮色下白线看不见，所以亮色改用黑色低透明度。 */
export function titleBarBorder(isDark: boolean): string {
  return isDark ? 'border-white/10' : 'border-black/5';
}

export function menuSurface(isDark: boolean): string {
  return isDark
    ? 'bg-[#2a2a2e]/85 border border-white/15 text-white'
    : 'bg-white/85 border border-black/10 text-gray-800';
}

export function dialogSurface(isDark: boolean): string {
  return isDark
    ? 'bg-[#2a2a2e]/85 border border-white/15 text-white'
    : 'bg-white/85 border border-white/60 text-gray-800';
}

/** 菜单项 hover：暗色用白色提亮，亮色用黑色压暗。 */
export function menuItemHover(isDark: boolean): string {
  return isDark ? 'hover:bg-white/10' : 'hover:bg-black/5';
}
