# WebDesk 收尾优化清单

> 竣工后代码审阅结论。按优先级编号挑选；本轮已按用户确认实现部分条目（见各条 **状态**）。
>
> 审查范围：`src/` 数据流、GitHub 同步、打开链接、localStorage、导入/导出、Dock/设置入口。产品边界仍以 PRD 为准（不做移动端、不做中心化登录、不同步自定义壁纸与 Token）。

**怎么挑**

- 只写编号即可；写「P0 全做」等于 1–3。
- 多项可一次做完；有依赖的会在条目里注明。
- 改完对应项后，应同步更新本文件状态（`待选` → `已完成`）以及 PRD / `AGENTS.md`（若行为或文档承诺变了）。

---

## P0 — 建议做（正确性 / 会踩坑）

### 1. 同步：本地变更立刻更新 `updatedAt`；409 不要盲覆盖

**状态**: 已完成

**问题是什么**  
本地改书签/布局/设置时，`updatedAt` **不会马上改**，只有 GitHub 推送成功后才写时间戳。两台设备同时改时容易丢数据。

**具体会怎样**

1. 设备 A 已推上云端（时间戳较新）。设备 B 刚改完、防抖 5 秒还没推：B 再推时发现「云端更新」→ **直接跳过推送**。B 下次打开页面会被提示 Load；一点 Load 就会 **用云端盖掉 B 还没同步的本地改动**。
2. 推送遇到 GitHub **409 SHA 冲突**时，当前逻辑会用 **本机旧内容 + 最新 SHA** 再 PUT 一次，等于 **用本机覆盖刚写上去的另一台设备**，和「不覆盖远端更新」的设计相反。

另外：若在 5 秒防抖内关掉标签页，云端不会更新（本机 localStorage 仍在）。可在同一次改动里顺带做「页面隐藏/关闭前尝试推一次」（见实现方向）。

**建议改法**

- 每次会触发同步的本地 `setData` 都 bump `updatedAt`（`Date.now()`）。
- 409 时：先拉远端，比较 `updatedAt` / 内容归一化结果；远端更新则提示 Load，不要盲 PUT。
- 可选同一项：`visibilitychange` / `pagehide` 时若有未推送变更则立即 `doPush`。

**涉及文件（预估）**: `src/hooks/useSync.ts`，可能还有 `src/App.tsx`（统一 bump 时间戳）。

---

### 2. 关掉 Dock 之后仍能打开设置

**状态**: 已完成（方案 B：禁止关闭 Dock）

**问题是什么**  
设置里可以取消「Show dock」。Dock 上有设置齿轮。关掉后 **没有任何入口再打开设置**，只能手动改 localStorage。

**建议改法（择一，实现时默认 A，除非你指定）**

- **A（推荐）**：右上角常驻一个小齿轮（可与搜索、计数器并排），不依赖 Dock。
- **B**：禁止关掉 Dock，或关掉后仍留「设置」一颗图标。
- **C**：桌面空白处右键 → Settings（PRD 曾把空白右键标为延后）。

**涉及文件（预估）**: `src/App.tsx`，`src/components/SettingsWindow.tsx`，可能 `src/components/Dock.tsx`。

---

### 3. 打开链接只允许 http(s)，并加上 `noopener`

**状态**: 已完成

**问题是什么**

- HTML **导入**会跳过 `javascript:`，**手动添加**不会做同等过滤。`!url.startsWith('http')` 只是给没写协议的地址前面加 `https://`，拦不住 `javascript:`、大小写变体、`data:text/html` 等。同步下来的脏数据同样会走进 `window.open`。
- 当前是 `window.open(url, '_blank')`，**没有 `noopener` / `noreferrer`**。新标签页可以碰到 `window.opener`（反向 Tabnabbing）。对本应用是静态 GitHub Pages，严重程度中等，但改动很小。

**建议改法**

- 统一 `openBookmarkUrl(url)`：只允许 `http:` / `https:`（建议大小写不敏感）；非法则不打开并可短提示。
- 所有打开入口都走它：桌面图标、Dock、文件夹窗口、搜索。
- `window.open(url, '_blank', 'noopener,noreferrer')`。

**涉及文件（预估）**: 新建小工具函数（如 `src/lib/openUrl.ts`），以及 `App.tsx`、`DesktopIcon.tsx`、`Dock.tsx`、`FolderWindow.tsx`、`SearchBar.tsx`、`BookmarkImporter.tsx`（导入过滤与打开规则对齐）。

---

## P1 — 收尾体验

### 4. 设置里增加 JSON 导入（与现有导出对称）

**状态**: 本次不做

**问题是什么**  
已有「Export bookmarks as JSON」，恢复备份只能靠 GitHub 同步或手动改 localStorage。Fork 用户、未配 Token 时没有正规恢复路径。

**建议改法**

- 设置 Data 区增加 Import JSON：校验 `version` / `bookmarks` / `settings` / `dockItems` 结构。
- 导入前确认「将替换当前桌面数据」。
- 与导出一致：**不恢复 customWallpaper**（避免撑爆存储）；Token 仍不在这份 JSON 里。
- 导入后走现有同步防抖（若已配置 Token）。

**涉及文件（预估）**: `src/App.tsx`，`src/components/SettingsWindow.tsx`。

---

### 5. 右上角计数改为递归统计

**状态**: 已完成

**问题是什么**  
`Bookmarks: {data.bookmarks.length}` 只统计 **桌面第一层**。文件夹里的链接不算。文件夹数量同样只算顶层。导入很多书签后数字会误导。

**建议改法**  
递归统计：链接总数、文件夹总数（或「顶层图标 | 全部链接」两行，实现时选一种并改文案）。

**涉及文件（预估）**: `src/App.tsx`。

---

### 6. 自定义壁纸写入失败要提示（并尽量避免撑爆配额）

**状态**: 已完成（失败提示 + 上限 5MB；未拆独立 key）

**问题是什么**  
壁纸上限 5MB，转 Data URL 约 6–7MB，和书签写在同一个 `webdesk-data-v3`。`localStorage` 常见配额约 5–10MB。超限时 `useLocalStorage` 只 `console.error`，界面像保存成功，**刷新就丢**。

**建议改法**

- `setItem` 失败时界面提示（不要只打控制台）。
- 降低上限（例如 1–2MB）和/或压缩后再存。
- 可选：壁纸单独 key，避免一次失败把整份书签写入也失败（若拆 key，需处理「书签已更新、壁纸未写入」的一致性）。

**涉及文件（预估）**: `src/hooks/useLocalStorage.ts`，`src/components/SettingsWindow.tsx`。

---

### 7. 空桌面拖 HTML：真能导入，或改文案

**状态**: 已完成（方案 B：仅改文案）

**问题是什么**  
空状态写「拖 HTML 书签文件即可导入」，但 **只有导入弹窗打开时** 才 `preventDefault` 全局 drop。直接往桌面拖，浏览器往往会 **整页打开该文件**，桌面数据全没了观感。

**建议改法（择一）**

- **A（推荐）**：根布局始终拦截 drop；拖到桌面则打开导入流程（或直接解析）。
- **B**：只改文案，明确要先点 Dock 的 Import。

**涉及文件（预估）**: `src/App.tsx` 或 `src/components/Desktop.tsx`，`src/components/BookmarkImporter.tsx`。

---

### 8. 导入预览文案与「平铺解析」一致

**状态**: 已完成（仅改文案）

**问题是什么**  
解析是遍历所有 `<A>` **平铺**，不建文件夹。预览却可能出现 “folder structure preserved” 一类表述（当前解析几乎不会产生 folder 节点，文案易错）。PRD 写明平铺，应与 UI 一致。

**建议改法**  
改文案：说明会打平所有链接、不保留浏览器文件夹树。若预览里 folder 计数恒为 0，去掉该分支。

**涉及文件（预估）**: `src/components/BookmarkImporter.tsx`。

**说明**：本项 **不** 做「导入时还原文件夹树」（那是新功能，见下方「明确不做」）。

---

## P2 — 顺手 / 小一致性

### 9. Favicon 失败占位不要用 `innerHTML`

**状态**: 已完成

**问题是什么**  
`DesktopIcon` / `FolderWindow` 在 favicon `onError` 时用 `innerHTML` 拼名称首字符。现在几乎插不进完整 XSS，但是坏习惯；Token 又在 localStorage，页面 XSS 代价高。

**建议改法**  
失败时改 React state 显示字母，或 `textContent`，不要 `innerHTML`。

**涉及文件（预估）**: `src/components/DesktopIcon.tsx`，`src/components/FolderWindow.tsx`。

---

### 10. Dock 钉上的书签也走 Google Favicon

**状态**: 已完成

**问题是什么**  
桌面图标会请求 Google Favicon；Dock 里若没有 `bookmark.favicon` 字段（多数情况没有），只显示首字母，和桌面不一致。

**建议改法**  
与 `getFaviconUrl` 同一套逻辑（可抽到 `src/lib/`）。

**涉及文件（预估）**: `src/components/Dock.tsx`，可能抽公共函数。

---

### 11. 书签/文件夹/待办 ID 改用 `crypto.randomUUID()`

**状态**: 本次不做

**问题是什么**  
现用 `` `bookmark-${Date.now()}` `` 等。同一毫秒连点两次「新建文件夹」可能撞 ID，树操作会乱。

**建议改法**  
`crypto.randomUUID()`（现代浏览器 + GitHub Pages 足够）。导入批量 ID 同样换掉 `Date.now()+index` 亦可。

**涉及文件（预估）**: `src/App.tsx`，`BookmarkImporter.tsx`，`TodoWidget.tsx`。

---

### 12. 设置窗口黄/绿按钮：做最小化/最大化，或改 PRD 删掉承诺

**状态**: 已完成（方案 B：PRD 改为仅关闭）

**问题是什么**  
PRD 写 macOS 三按钮「关闭/最小化/最大化均可点击」；实现只有红点关闭。

**建议改法（择一）**

- **A**：黄=最小化（收成标题栏细条），绿=最大化/还原。
- **B**：不改代码，改 PRD / README，写明仅关闭。

**涉及文件（预估）**: A → `SettingsWindow.tsx` + PRD；B → 仅文档。

---

### 13. 文件夹窗口：只有拖到文件夹才算「移入」

**状态**: 本次不做

**问题是什么**  
窗口内拖拽会对 **任意** 子项做命中检测，松手时若目标是链接，`handleMoveToFolder` 找不到文件夹节点，**静默失败**。

**建议改法**  
只对 `type === 'folder'` 高亮与松手移入；拖到链接上不改变数据（可无提示）。

**涉及文件（预估）**: `src/components/FolderWindow.tsx`。

---

## 编号外：审查中看到、默认不做

下列不是「漏做的 bug」，或已在 PRD 标延后。**不要用编号点名它们**，除非你明确说「把某某做成新编号」。

| 主题 | 原因 |
|------|------|
| Token 明文存在 localStorage | Fork + Fine-grained Token 的既定方案；无法在无后端前提下做成真正的保密存储。文档里已提示最小权限与公开仓库风险。 |
| `webdesk-data.json` 公开 | 同步设计就是提交到仓库；书签 URL 会公开。 |
| 自定义壁纸不同步 / 待办不同步 | PRD 已确认。 |
| 导入时还原浏览器文件夹树 | PRD 明确平铺；与第 8 项（只改文案）分开。 |
| Command Palette（⌘K） | PRD v1.1 用右上角搜索代替，标为延后。 |
| 移动端适配、iframe 内嵌站点 | 产品边界。 |
| 桌面空白右键菜单 | PRD 延后；第 2 项若选 C 才做。 |
| 文件夹改回「双击打开」 | PRD 写双击，实现是单击（与书签一致）。属产品选择，不是缺陷；若要改请单独说。 |
| Vite `base: '/WebDesk/'` | 仓库名必须是 `WebDesk` 时 Pages 才对。README 教程应已覆盖；Fork 改名需改 `vite.config`。本次不改除非你点名。 |
| Google Favicon 隐私 | 每个域名会请求 Google；当前架构可接受，最多 README 补一句。 |
| GitHub Contents API 约 1MB | 书签极多时同步会失败。一般个人用量够用；第 4 项导入 JSON 时若要做体积校验可再加。 |
| 虚拟列表 / 大规模桌面性能 | 个人桌面够用；全量浏览器书签打平到桌面才会卡。优先靠导入进文件夹（新功能，默认不做）。 |

---

## 建议组合（可选，仍以你回复的编号为准）

| 组合 | 编号 | 适合 |
|------|------|------|
| 最小安全网 | 1、2、3 | 先堵住丢数据和进不去设置 |
| 备份闭环 | 4 | 无 Token 也能备份恢复 |
| 导入体验 | 7、8 | 文案与拖放一致 |
| 小一致性 | 5、9、10、11、13 | 工作量小、观感更好 |
| 设置窗口 PRD 对齐 | 12 | 交互或改文档二选一 |

---

## 实现时注意（给你挑完编号之后看）

- 不扩大范围：只做你点的编号；不顺手做「明确不做」表里的项。
- 同步逻辑改动（第 1 项）应尽量用两台设备或两个浏览器配置验证：先后编辑、409、Dismiss Load。
- UI 改动按项目惯例：能开浏览器则走一遍相关路径，而不是只截一张图。
- 若改了用户可见行为或存储约定：更新 `references/docs/PRD.md`、`AGENTS.md`、必要时双语 README。
