/**
 * 玻璃表面口径。
 *
 * 之前每个窗口各写一套 `bg-gray-800/95`，95% 不透明的深色在暗色主题下就是一块黑板，
 * 和小组件的 `bg-white/10` 质感断层。这里统一管理，分两类表面：
 *
 * - 窗口（文件夹窗 / 设置窗）：**标题栏半透明玻璃，内容区接近实底**。
 *   内容区必须实一点——高反差壁纸下半透明会让桌面图标透到文字上，两层字叠一起读不出来。
 *   macOS 自己的窗口也是这个结构：磨砂只在标题栏和侧栏，正文区并不透。
 * - 浮层（右键菜单 / 搜索下拉 / 弹窗）：浮在内容之上，取中等透明度。
 *
 * 暗色不用深灰当底，而用**白色低透明度**叠在深色壁纸上——结果是一层浅灰玻璃，
 * 白字对比度够，又不会像纯黑那样闷。
 *
 * ⚠️ Tailwind 的透明度只认默认刻度（5 的倍数）。写 `bg-white/92`、`bg-black/8`
 * 不会生成任何 CSS，且不报错——内容区会静默退回全透明。历史上两次踩过这个坑。
 */

/** 所有窗口共用的模糊层：blur 足够大才像玻璃，saturate 让壁纸颜色透得更接近 macOS。 */
export const glassBlur = 'backdrop-blur-2xl backdrop-saturate-150';

/** 窗口外壳（标题栏所在的层）。 */
export function windowSurface(isDark: boolean): string {
  return isDark
    ? 'bg-white/20 border-white/25 ring-1 ring-inset ring-white/10 text-white'
    : 'bg-white/75 border-white/70 ring-1 ring-inset ring-white/60 text-gray-800';
}

/** 窗口内容区：接近实底，保证密集文字在任何壁纸上都读得清。 */
export function windowBodyTint(isDark: boolean): string {
  return isDark ? 'bg-[#2a2a2e]/95' : 'bg-white/95';
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
