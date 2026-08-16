# WebDesk — AGENTS.md

个人 Web 桌面的探索性项目。已竣工并上线。

## 工作流

1. **Discovery** ✅ — `references/discovery/` 下四份文档已填充完毕
2. **PRD** ✅ — `references/docs/PRD.md` 已确认
3. **MVP Vibecoding** ✅ — 已完成并构建通过
4. **v1（GitHub 同步）** ✅ — 已完成并通过多设备验证
5. **上线（Fork 分发）** ✅ — 已部署至 GitHub Pages，Fork 流程经新账号实测验证
6. **v1.1（小组件与效率）** ✅ — 已完成
7. **收尾** 🔄 — 双语 README 已就绪；待拍摄演示视频/GIF 放入 README

## 当前状态

- **项目已竣工**：核心功能全部完成并上线
- **线上地址**：https://bornfreeyan.github.io/WebDesk/
- **仓库**：BornfreeYan/WebDesk（Fork 分发已验证，README 提供完整教程）
- **技术栈**：Vite + React 19 + TypeScript + Tailwind CSS v3 + @dnd-kit/core + lucide-react
- **产品方向**：形态 A（桌面风格书签管理器），目标用户为开发者
- **README**：中文默认（README.md）+ 英文（README.en.md）双语，含 Fork/Token/同步教程
- **License**：MIT

## 已实现功能总览

- 空桌面启动（无预置书签）；单击图标新标签页打开
- 图标自由拖拽 + 边界限制；macOS 风格 Dock（悬停放大、打开指示点、accent 描边）
- 手动添加 / 浏览器 HTML 书签导入（平铺解析）
- 文件夹系统：嵌套、双击开窗、窗口内拖拽归入、右键"移动到文件夹"树形选择、移到桌面、递归重命名/删除、防循环
- 全局搜索（右上角，模糊匹配所有层级）
- 桌面小组件：时钟（毛玻璃）、待办（增删勾选编辑、多行显示），均可拖拽、本地存储、设置开关
- 设置窗口：红/黄/绿三按钮、可拖拽、最大化/最小化、内容滚动
- 亮暗模式、System Accent 主题色、多款壁纸 + 自定义上传
- GitHub 同步：Fine-grained Token 配置、加载自动拉取、变更 5s 自动推送、时间戳冲突处理、409 自动重试、壁纸不同步
- 数据本地备份：设置 → Export bookmarks as JSON
- 全站英文 UI（书签名/文件夹名为用户数据，不翻译）

## 文档索引

- `references/discovery/`：Brainstorm / Research / User Stories / Questions（四份）
- `references/docs/PRD.md`：产品需求文档（含 v1.1 章节与里程碑）
- `README.md` / `README.en.md`：用户文档（中文/英文双语）
- `AGENTS.md`：本文件

## Agent 注意事项

- `references/` 目录为唯一信息源，后续变更需同步更新
- 用户数据存储：localStorage `webdesk-data-v3`（书签）、`webdesk-widgets-v1`（小组件）、`webdesk-sync-config`（Token）
- 同步数据文件：仓库根目录 `webdesk-data.json`（含 updatedAt 时间戳）
- 部署 workflow 仅代码变更触发（`src/`、配置等），数据同步不触发部署
- 代码已迁移至根目录，不再嵌套 `webdesk/` 子目录
