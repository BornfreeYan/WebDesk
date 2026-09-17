# WebDesk 产品需求文档（PRD）

> 基于 `references/discovery/` 讨论文档的结论汇总。本文档为后续开发（Vibecoding）的唯一依据，开发前确保本文档已确认。

---

## 1. 产品概述

### 1.1 一句话定位

运行于浏览器中的**个人桌面书签管理器**——将网站书签以桌面图标的形式组织，提供类 macOS 桌面点击交互。本质是用桌面隐喻做导航页，不是 Web OS。Your desktop on the web。

### 1.2 目标用户

**主要用户**: 开发者 / 技术爱好者（能接受 fork repo + 配置 GitHub Token 的门槛）。

**用户画像**: 
- 有自己的常用工具站和文档站，希望有一个统一入口
- 追求桌面整洁，喜欢极简、美观的工具
- 愿意自己动手配置，不期望开箱即用的 SaaS 服务

### 1.3 产品边界（明确不做）

- ❌ 不是超级综合导航站（不做几十个上百个书签的聚合）
- ❌ 不是 Web OS（不碰文件系统、存储管理、命令行）
- ❌ 不做站内窗口嵌套（点击图标直接新标签页打开目标站，不 iframe 嵌套）
- ❌ 不做用户登录 / 邮箱注册 / 依赖开发者服务器的中心化方案
- ❌ 暂不做移动端适配（桌面端 only）
- ❌ 不做复杂的站内窗口管理（没有多窗口层叠、z-index 系统）
- ❌ 不做浏览器扩展或后端采集接口（Inbox 的录入只发生在 WebDesk 页面内，保持纯静态无后端）

---

## 2. 功能需求

### 2.1 MVP（最小可用版本）

MVP 已完成。目标是：用户打开页面，看到一个漂亮的类 macOS 桌面，点击图标能打开网站，刷新后数据不丢。

| 功能 | 状态 | 描述 | 验收标准 |
|---|---|---|---|
| **桌面渲染** | ✅ | 加载后显示渐变背景 + 图标网格 + 底部 Dock 栏 | 图标从 localStorage 读取；桌面比例适配常见屏幕 |
| **图标点击** | ✅ | 单击书签图标在新标签页打开对应 URL | 仅 `http`/`https`；`window.open(..., 'noopener,noreferrer')`；无 iframe / 站内嵌套 |
| **图标管理** | ✅ | 手动添加、删除书签（名称 + URL） | Dock 栏"+"按钮；表单校验 URL；即时生效 |
| **图标拖拽** | ✅ | 桌面图标可自由拖拽到任意位置 | 拖拽后位置即时更新；有边界限制（不进入 Dock 区域）；刷新后保持（localStorage） |
| **书签导入** | ✅ | 支持上传浏览器导出的 HTML 书签文件 | 解析 Netscape Bookmark Format；展示解析结果供确认；自动跳过 `wait for reading` 等文件夹 |
| **删除书签** | ✅ | 鼠标悬停图标时显示红色删除按钮 | 红色圆形叉按钮；点击即时删除 |
| **右键菜单** | ✅ | 图标右键唤起操作菜单 | 固定到 Dock / 从 Dock 移除 / 删除；右键不触发打开链接 |
| **设置面板** | ✅ | 浮动设置窗口，可调整亮暗模式 | 小型浮动卡片；左上角仅关闭按钮（红点）；可拖拽标题栏 |
| **Dock 栏** | ✅ | 底部 Dock 栏可自定义，支持常用书签快捷入口 | 右键"固定到 Dock"可将图标加入；Dock 图标点击打开链接；**Dock 始终显示**（不可关闭，避免无法打开设置） |
| **数据持久化** | ✅ | 所有用户数据保存在浏览器 localStorage | 刷新/重启后恢复书签列表、图标位置、主题设置、Dock 配置 |
| **空状态引导** | ✅ | 首次使用无书签时给出引导 | 空桌面提示通过 Dock 的 + / Import 添加或导入书签；不预置默认书签 |

### 2.2 v1（完整体验）

v1 在 MVP 基础上增加跨设备同步和体验优化。

| 功能 | 状态 | 描述 | 验收标准 |
|---|---|---|---|
| **GitHub 同步** | ✅ | 配置 GitHub Token 后，书签数据可同步到 GitHub 仓库 | 设置面板提供 Token + Owner + Repo + Branch 输入；保存后测试 API 连通性；本地变更后 debounce 5s 自动推送；提供手动同步按钮 |
| **跨设备恢复** | ✅ | 在另一设备打开同一实例，能拉取 GitHub 上的书签数据 | 页面加载时自动拉取并比较 `updatedAt`：云端更新则提示加载；本地更新则自动推送；同步完成后另一设备刷新即可看到最新数据 |
| **图标 favicon** | ✅ | 书签图标自动显示对应网站的 favicon | 默认尝试加载 Google Favicon API；无真实图标时显示名称**第一个字形**（字母或 CJK）；**名称以 emoji 开头则用该 emoji 作为图标**（不强制走 favicon） |
| **壁纸切换** | ✅ | 设置面板中的壁纸选项可用 | mesh / gradient / dawn 三种风格实际生效；动态生成 CSS 渐变背景 |
| **文件夹归纳** | ✅ | 支持将书签归类到文件夹 | 创建文件夹与子文件夹；单击打开独立窗口（与书签单击一致）；图标可拖入文件夹（同级窗口内）；**跨层级移动通过右键"移动到文件夹"选择树形目标完成**；递归重命名/删除 |

### 2.3 v1.1（体验迭代）

v1.1 在 v1 基础上增加桌面小组件与效率功能。

| 功能 | 状态 | 描述 | 验收标准 |
|---|---|---|---|
| **桌面时钟** | ✅ | 毛玻璃质感时钟小组件 | 显示时间/日期；可自由拖拽；位置持久化（localStorage）；设置中可启用/禁用 |
| **桌面待办** | ✅ | 毛玻璃质感待办小组件 | 支持添加/删除/勾选；**点击文字可编辑内容**；**多行完整显示**；可自由拖拽；内容与位置持久化（localStorage）；设置中可启用/禁用 |
| **全局搜索** | ✅ | 右上角搜索框，模糊匹配书签/文件夹 | 输入即过滤所有层级书签；点击书签打开链接、点击文件夹打开窗口；Esc/失焦关闭 |
| **删除按钮收敛** | ✅ | 图标 hover 删除按钮改为灰色常态、hover 变红 | 视觉上不再扎眼，符合 macOS 关闭按钮惯例 |
| **图标文字对齐** | ✅ | 图标下方名称改为最多两行居中换行 | 长名称不再单行截断偏左，短名称保持居中 |
| **JSON 导出** | ✅ | 设置面板提供数据备份导出 | "Export bookmarks as JSON" 下载书签/布局/设置备份（不含壁纸）；设置页 Data 区块 |
| **Emoji 作图标** | ✅ | 名称以 emoji 开头时用该字形当图标 | 桌面 / Dock / 文件夹窗口 / 搜索一致；完整 grapheme（含国旗、肤色）；emoji 不在开头时仍走 favicon |

> 设计约束：时钟/待办为**本地功能，不参与 GitHub 同步**（沿用"同步范围=书签+布局+设置"原则，小组件数据独立存 localStorage）。Inbox 只在这一条上部分例外：**条目内容**存在书签树里的 Inbox 文件夹中（因此随书签同步、随 JSON 导出、可被全局搜索），只有组件的位置与开关留在 localStorage。详见 2.4。

### 2.4 v1.2（Inbox 待看收件箱）

v1.2 解决一个具体摩擦：想「稍后再看」一个链接时，不必在 B 站、YouTube、X 各自的收藏夹里分散存放、再逐个点开，而是统一粘贴到桌面上的一个 Inbox。

| 功能 | 状态 | 描述 | 验收标准 |
|---|---|---|---|
| **快速捕获窗口** | ✅ | Dock 新增入口 + 组件上的 Add 按钮，打开捕获窗口 | URL 框自动聚焦；Ctrl+V 粘贴、按一次 Enter 直接入库；名称由 URL 自动推导（去协议与 `www.`、保留路径）；非法协议（`javascript:` 等）被拒并提示 |
| **可选备注** | ✅ | 入库时可写一句「为什么留着」 | 备注可选，Tab 切换到备注框；存于 `Bookmark.note`；组件列表里备注显示为主行、推导名显示为副行（两行都单行截断，组件高度只随条目数变化） |
| **Inbox 组件** | ✅ | 毛玻璃小组件，显示最近 3 条 | 与时钟/待办同款质感；可拖拽；位置与开关持久化（localStorage）；设置中可启用/禁用；数量徽标显示待看总数；空态有引导文案 |
| **打开全部** | ✅ | 组件上的 All 按钮打开完整 Inbox | 复用现有文件夹窗口（网格、右键重命名/删除/移动、递归删除）打开 `settings.inboxFolderId` 指向的文件夹；未创建时改为打开捕获窗口 |
| **出库** | ✅ | 列表项 hover 显示 × 即刻删除 | 与桌面图标删除共用同一套逻辑（`handleDeleteBookmark`） |
| **数据归属** | ✅ | Inbox 是书签树里的普通文件夹，不另建存储 | 条目跟随 GitHub 同步、进入 JSON 导出、可被全局搜索；备注参与搜索匹配；文件夹磁贴以备注为主行、名称作次级行，hover tooltip 显示 URL |
| **旧数据兼容** | ✅ | v1.1 存量的 `webdesk-widgets-v1` 没有 `inbox` 字段 | 读写两侧都做归一化补齐（`normalizeWidgets`）；老用户升级后不白屏、组件开关状态不丢失 |
| **懒创建** | ✅ | Inbox 文件夹在首次入库时才创建 | 未入库前桌面不出现 Inbox 图标；创建时按现有网格规则落位 |

> 数据约定：`settings.inboxFolderId` 记录 Inbox 文件夹 id（随 settings 同步）；`Bookmark.note` 与 `Bookmark.createdAt` 为可选字段，老数据无需迁移。**同步逻辑无需改动**——书签整树参与同步，settings 走展开合并。

### 2.5 扩展（后续迭代）

以下功能明确列入"不做"或"延后"，不进入 MVP/v1/v1.1/v1.2 排期：

| 功能 | 决策 | 原因 |
|---|---|---|
| **番茄钟/计时器** | 延后 | 受众小、与书签/桌面关系弱 |
| **Inbox 的书签小工具（bookmarklet）/ 桌面全局粘贴捕获** | 延后 | 本轮先做页面内捕获；bookmarklet 还需处理收到的 URL 校验与"云端更新提示"覆盖新条目的顺序问题 |
| **文件夹窗口内直接添加链接** | 延后 | 本轮由捕获窗口覆盖同一需求，通用化留给后续 |
| **窗口管理系统**（多窗口层叠、z-index） | 不做 | 已明确不做站内窗口嵌套；设置卡片是唯一浮动窗口 |
| **移动端适配** | 不做 | 桌面隐喻在移动端天然不合适 |
| **用户自定义图标图片** | 延后 | 先依赖自动 favicon 获取 |
| **桌面空白处右键菜单** | 延后 | 已有 Dock 按钮，收益一般 |
| **Command Palette（⌘K）** | 延后 | v1.1 已用右上角搜索框实现同等价值 |
| **设置窗口最小化/最大化** | 不做 | 仅保留关闭；黄/绿按钮不实现 |

---

## 3. 视觉与交互规范

### 3.1 设计风格

- **整体风格**: 苹果 macOS 桌面风格
- **质感**: 圆角、半透明磨砂（glassmorphism）、细腻阴影
- **配色**: 支持亮/暗模式切换；提供几种主题色可选（如系统蓝、紫、绿等）
- **壁纸**: MVP 内置 3-5 张精选壁纸供选择，默认使用一张简约风景/渐变壁纸

### 3.2 关键交互元素

| 元素 | 规范 |
|---|---|
| **桌面图标** | 方形圆角图标 + 下方文字标签（无背景色块，长名称最多两行居中换行）；图标大小约 60-80px；网格间距约 20px；可自由拖拽 |
| **Dock 栏** | 底部居中，类似 macOS Dock；图标有放大悬停动效；支持 5-10 个常驻图标 |
| **设置窗口** | 小型浮动卡片，约占屏幕 1/6；圆角 12-16px；半透明背景；标题栏可拖拽；左上角仅关闭按钮（红点） |
| **动画** | 图标点击有轻微缩放反馈；拖拽有平滑跟随；设置窗口打开有关闭有淡入淡出/缩放动效 |

### 3.3 参考案例

- 视觉/交互参考: https://github.com/viviannnl/personal-web（取其 macOS 风格桌面、Dock、窗口卡片的设计思路，不取其完整 OS 架构）
- 部署/书签参考: https://github.com/rbetree/menav（取其纯静态部署、书签导入、fork 分发的模式）

---

## 4. 技术方案

### 4.1 技术栈（已确认）

| 层级 | 选型 | 理由 |
|---|---|---|
| **构建工具** | Vite | 轻量、开发速度快、纯静态输出可部署到 GitHub Pages |
| **框架** | React + TypeScript | 类桌面交互需要组件化状态管理，React 生态拖拽/动画库成熟 |
| **样式** | Tailwind CSS | 快速实现 macOS 风格（圆角、阴影、半透明） |
| **拖拽** | `@dnd-kit/core` | React 生态最成熟的拖拽库，支持网格自由拖拽 |
| **动画** | `framer-motion` 或 GSAP | 实现 Dock 动效、窗口打开关闭动效 |
| **图标获取** | Google Favicon API (`https://www.google.com/s2/favicons?domain=`) | 无需后端，浏览器端直接请求 |

### 4.2 数据流

```
用户操作（添加/拖拽/删除/文件夹）
    ↓
localStorage（默认持久化层，key: webdesk-data-v3）
    ↓
v1 阶段可选: GitHub API 同步（配置 Token 后）
    ↓
GitHub Repo 中的 webdesk-data.json（云端备份）
```

**同步范围**（v1 已确认，v1.2 补充 Inbox）：
- ✅ 同步：书签（含文件夹层级，含 `note` / `createdAt`）、图标位置、Dock 配置、基本设置（主题/主题色/内置壁纸选项、`inboxFolderId`）
- ❌ 不同步：自定义壁纸图片（base64 过大，每台设备本地设置）、GitHub Token（单独 localStorage key）、小组件的位置与开关（`webdesk-widgets-v1`）
- ℹ️ Inbox 条目属于书签树，**内容参与同步**；只有 Inbox 组件的位置与开关不参与。这是它与时钟/待办的关键区别

**数据格式**（webdesk-data.json / localStorage 同构）：
```json
{
  "version": 1,
  "updatedAt": 1712345678901,
  "settings": {
    "theme": "dark",
    "accentColor": "#007AFF",
    "wallpaper": "gradient",
    "showDock": true,
    "inboxFolderId": "uuid-3"
  },
  "bookmarks": [
    {
      "id": "uuid",
      "name": "GitHub",
      "type": "link",
      "url": "https://github.com",
      "favicon": "https://www.google.com/s2/favicons?domain=github.com",
      "position": { "x": 120, "y": 200 }
    },
    {
      "id": "uuid-2",
      "name": "开发工具",
      "type": "folder",
      "position": { "x": 300, "y": 200 },
      "children": []
    },
    {
      "id": "uuid-3",
      "name": "Inbox",
      "type": "folder",
      "position": { "x": 300, "y": 90 },
      "children": [
        {
          "id": "uuid-4",
          "name": "bilibili.com/video/BV1xx",
          "type": "link",
          "url": "https://www.bilibili.com/video/BV1xx",
          "note": "之后看看这个 GO 语法教程",
          "createdAt": 1712345678901,
          "position": { "x": 0, "y": 0 }
        }
      ]
    }
  ],
  "dockItems": ["uuid", "uuid-2"]
}
```
> 说明：`updatedAt` 为毫秒时间戳，用于多设备冲突时判断新旧；`customWallpaper` 不写入云端。
> `note` / `createdAt` 为 v1.2 新增的可选字段，向后兼容——缺失时不影响渲染，存量数据无需迁移。
> Inbox 文件夹内的条目 `position` 无意义（文件夹窗口用 CSS 网格排版），统一写 `{ "x": 0, "y": 0 }`。

### 4.3 部署方案

**默认推荐**: GitHub Pages

1. 用户 fork 原始仓库
2. 在仓库 Settings → Pages 中启用 GitHub Actions 部署
3. （可选）在设置面板配置 GitHub Token 启用同步

**备选**: Vercel / Cloudflare Pages（在文档中提及，不作为默认路径）

---

## 5. 风险与待确认事项

以下问题已记录在 `references/discovery/04-questions.md`，需在开发前或开发中确认：

| 问题 | 当前状态 | 影响 |
|---|---|---|
| **图标布局: 自由拖拽 vs 网格吸附** | 已确认：自由拖拽（不吸附） | 拖拽交互实现和数据结构 |
| **书签分类呈现方式** | 已确认：桌面文件夹（单击打开窗口） | 界面布局和数据结构 |
| **Token 配置方式: 前端面板 vs 修改文件** | 已确认：前端面板 | 去中心化分发的易用性 |
| **是否预置默认书签** | 已确认：不预置（空桌面） | 空状态体验 |
| **同步范围** | 已确认：书签+布局+Dock+基本设置，不含壁纸 | 数据格式与同步逻辑 |
| **冲突策略** | 已确认：时间戳比较 + last-write-wins | 多设备体验 |
| **Inbox 数据存放位置** | 已确认：书签树内的 Inbox 文件夹（随同步），不用独立 localStorage | 数据持久性、导出与搜索的一致性 |

**建议**: MVP 阶段先采用最简方案——自由拖拽（不吸附）、单层桌面无文件夹分类、前端配置 Token、预置 5-8 个开发者常用书签。后续根据用户反馈迭代。

---

## 6. 里程碑

| 阶段 | 目标 | 产出 | 状态 |
|---|---|---|---|
| **MVP** | 可运行的本地桌面书签页 | 能添加/导入/拖拽/点击图标；有设置面板；数据持久化 | ✅ 已完成 |
| **v1** | 可跨设备同步的完整产品 | GitHub 同步可用；有 favicon 自动获取；文件夹归纳；壁纸切换 | ✅ 已完成 |
| **v1.1** | 桌面小组件 + 效率功能 | 时钟/待办小组件；全局搜索；删除按钮收敛 | ✅ 已完成 |
| **v1.2** | 统一「待看」入口 | Inbox 快速捕获窗口 + 桌面组件 + 可选备注；条目存于书签树随同步 | ✅ 已完成 |
| **上线** | 可对外发布的开源项目 | 代码推送至 GitHub 仓库；GitHub Pages 部署；README 部署教程完整；接受社区反馈 | ✅ 已完成 |

---

## 7. 附录

### 7.1 书签导入文件格式

浏览器导出的书签 HTML 遵循 Netscape Bookmark File Format，结构为嵌套的 `<DL>` / `<DT>` / `<A>` 标签，可通过浏览器内置 `DOMParser` 解析。

### 7.2 GitHub API 同步要点

- **文件路径**: 仓库根目录 `webdesk-data.json`
- **读取**: `GET /repos/{owner}/{repo}/contents/webdesk-data.json`（返回 base64 内容 + 当前 SHA；404 表示首次使用）
- **写入**: `PUT /repos/{owner}/{repo}/contents/webdesk-data.json`（需传入当前 SHA；首次创建无需 SHA）
- **CORS**: GitHub API 支持浏览器跨域直接调用
- **速率限制**: 认证用户 5,000 req/hour，单用户操作足够；避免高频自动同步（debounce 5s）
- **Token**: 存于 localStorage 独立 key（`webdesk-sync-config`）；建议 fine-grained token，仅授权目标 repo 的 Contents: Read & Write 权限
- **冲突处理**（单用户多设备，已确认）:
  1. 推送前先重新 `GET` 最新 SHA 和内容，比较 `updatedAt`
  2. 远端 `updatedAt` 较新 → 跳过推送，提示"云端有更新"
  3. 本地较新 → 用最新 SHA 写入（last-write-wins）
  4. PUT 返回 409 时重取远端：若远端较新则提示加载，**不得用旧内容盲覆盖**
- **本地时间戳**: 用户改书签/布局/设置时立即写入 `updatedAt`（不以推送成功时刻为准）
- **加载策略**: 页面加载时自动拉取；远端 `updatedAt` 较新时提示用户加载云端数据，本地较新时自动推送；切走标签页时尝试冲刺推送

### 7.3 参考文档

- Brainstorm: `references/discovery/01-brainstorm.md`
- Research: `references/discovery/02-research.md`
- User Stories: `references/discovery/03-user-stories.md`
- Questions: `references/discovery/04-questions.md`
- Optimization: `references/discovery/05-optimization.md`
- Inbox: `references/discovery/06-inbox.md`
- Demo recording: `references/docs/demo-recording.md`
