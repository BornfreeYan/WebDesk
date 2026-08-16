# WebDesk — AGENTS.md

个人 Web 桌面的探索性项目。MVP 已实现并构建通过。

## 工作流

1. **Discovery** ✅ — `references/discovery/` 下四份文档已填充完毕
2. **PRD** ✅ — `references/docs/PRD.md` 已确认
3. **MVP Vibecoding** ✅ — 已完成并构建通过
4. **v1 迭代** — 待开始（需 compact 上下文后推进）

## 当前状态

- **MVP 已完成**：本地桌面书签管理器核心功能已实现
- **v1 已完成**：GitHub 数据同步（Token 配置 + 跨设备恢复）已实现并通过多设备验证
- **上线已完成**：代码推送至 BornfreeYan/WebDesk，GitHub Pages 部署 workflow 已就绪，Fork 分发流程已验证
- **v1.1 已完成**：桌面时钟 + 待办小组件（毛玻璃、可拖拽、本地存储）、右上角全局搜索、删除按钮视觉收敛
- **技术栈已确定**：Vite + React 19 + TypeScript + Tailwind CSS v3 + @dnd-kit/core + lucide-react
- **产品方向已收敛**：形态 A（桌面风格书签管理器），目标用户为开发者

## MVP 已实现功能

- 空桌面启动（无预置书签）
- 单击图标在新标签页打开链接
- 图标自由拖拽 + 边界限制（不进入 Dock 栏区域）
- 手动添加书签 / 导入浏览器 HTML 书签
- 悬停删除按钮（红色叉）
- 右键菜单：固定到 Dock / 从 Dock 移除 / 删除
- macOS 风格设置窗口（红/黄/绿三按钮，可拖拽，最小化/最大化）
- 亮暗模式切换 + 主题色选择
- 数据持久化（localStorage）

## 后续方向（v1）

- GitHub API 同步（Token 配置 + 跨设备恢复）
- 图标 favicon 自动获取
- 文件夹归纳（用户已提出需求，待 compact 后推进）
- 壁纸背景切换（设置中已有 UI，功能待实现）

## Agent 注意事项

- **不要锁定 v1 技术栈**：当前技术栈仅服务 MVP，v1 可重新评估
- `references/` 目录为唯一信息源，后续变更需同步更新
- MVP 代码已迁移至根目录，不再嵌套 `webdesk/` 子目录
