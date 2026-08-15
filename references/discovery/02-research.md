# WebDesk 调研

> 基于 `01-brainstorm.md` 中的假设，对竞品、技术栈与同步方案进行可行性研究。

---

## 一、竞品分析

### 1. viviannnl/personal-web

- **仓库**: https://github.com/viviannnl/personal-web
- **定位**: 苹果风格的个人博客网站，具备完整的 Web OS 模拟交互
- **技术栈**: Next.js 15 + React 19 + Tailwind CSS v4 + GSAP + Supabase + better-sqlite3
- **与 WebDesk 的相关性**: ⭐⭐⭐⭐⭐（直接视觉与交互参考）

**架构亮点**:
- 完整的 OS 模拟层：`src/os/` 目录包含 Desktop、Dock、Window、MenuBar、OSContext 等组件
- Window 组件支持拖拽、z-index 管理、三按钮控制（绿黄红）
- 应用注册表模式（`src/os/registry.ts`），每个 app 是一个独立组件
- 使用 GSAP 做动画（BootSplash、动效等）
- 有 CommandPalette（命令面板）和音频反馈系统

**对我们的借鉴**:
- **视觉层**: Dock 动效、圆角磨砂、窗口卡片、三按钮设计均可直接参考实现思路
- **组件架构**: OSContext + registry 的模式适合管理"桌面图标 = 书签"的映射关系
- **需注意**: 这个项目是完整的 Web OS（有文件系统、终端、窗口管理），复杂度远超 WebDesk 需求。我们只取其视觉层和交互层，不取架构层。

**技术栈评估**:
- Next.js 15 + App Router，但该项目实际运行需要 Supabase 后端和 SQLite 本地数据库
- 对静态部署不友好，且 bundle 体积较大（React 19 + Next.js + GSAP + 大量 OS 组件）
- **结论**: 若 WebDesk 仅需要其视觉交互，不建议直接沿用其技术栈。

---

### 2. rbetree/menav

- **仓库**: https://github.com/rbetree/menav
- **定位**: 轻量级个人导航网站生成器
- **技术栈**: Astro（纯静态生成器）+ 原生 JavaScript + YAML 配置
- **与 WebDesk 的相关性**: ⭐⭐⭐⭐（功能定位最接近）

**架构亮点**:
- 纯静态构建，输出为 `dist/` 目录的 HTML/CSS/JS，可部署到任何静态托管服务
- 模块化配置系统：`config/user/` 目录下 YAML 文件控制站点内容
- **书签导入**: 支持将浏览器导出的 HTML 书签文件自动转换为 YAML 配置
- 与 MarksVault 浏览器扩展集成，可将书签推送到仓库的 `bookmarks/` 目录
- 支持多层级嵌套分类（2-4 层）
- 内置亮暗主题切换

**对我们的借鉴**:
- **部署模式**: Fork + GitHub Actions 自动构建部署到 GitHub Pages，与 WebDesk 设想的去中心化分发完全一致
- **书签导入**: `src/bookmark-processor.ts` 的 HTML 解析逻辑可直接参考
- **配置哲学**: "完全替换策略"（用户配置覆盖默认配置）适合开发者二次定制
- **需注意**: menav 是传统导航站布局（列表/卡片），没有桌面隐喻和拖拽交互

**技术栈评估**:
- Astro 纯静态构建，零运行时开销，首屏极快
- 原生 JS 操作 DOM，无框架负担，体积最小
- 但：实现复杂的拖拽交互、动画动效，原生 JS 开发效率较低
- **结论**: 若追求极致轻量和首屏速度，Astro + 原生 JS 是上限最高的方案；若追求开发效率和交互复杂度，React/Vue 更合适。

---

## 二、技术栈选型建议

基于 Brainstorm 确认的需求（苹果风格桌面交互、拖拽、Dock、窗口卡片、书签管理），对比三种方案：

| 维度 | Astro + 原生 JS | Vite + React | Next.js |
|---|---|---|---|
| **首屏/构建体积** | ✅ 最优（纯静态 HTML） | ⚠️ 中等（React runtime） | ⚠️ 较大（Next.js + React） |
| **拖拽/动画开发效率** | ⚠️ 需手写或引入小库 | ✅ 生态丰富（dnd-kit, framer-motion） | ✅ 同左 |
| **桌面窗口组件实现** | ⚠️ 需自建状态管理 | ✅ React Context / Zustand 天然适合 | ✅ 同左 |
| **部署到 GitHub Pages** | ✅ 最简单 | ✅ 也很简单（`output: 'dist'`） | ⚠️ 需 `output: 'export'` 且部分功能受限 |
| **学习/维护成本** | ⚠️ 对用户前端能力要求高 | ✅ 通用技术栈 | ✅ 通用技术栈 |
| **与竞品参考的契合** | ⚠️ menav 用 Astro，但无桌面交互 | ✅ viviannnl 用 Next.js，可取其交互模式 | ✅ 直接沿用参考架构 |

**建议**:
- **若用户熟悉 React**：选 **Vite + React**。开发效率最高，拖拽和动画库生态成熟（如 `@dnd-kit/core` + `framer-motion`），构建产物可静态部署。
- **若用户追求极致轻量且熟悉 Astro**：选 **Astro + 原生 JS + 少量动画库**。但拖拽和窗口管理的复杂度会显著增加开发时间。
- **Next.js 不推荐用于此项目**：Brainstorm 已确认不做 SSR、不做 API Routes、不做文件路由。Next.js 的优势用不上，却要支付框架体积和 `output: 'export'` 的限制成本。

**暂定推荐**: **Vite + React + TypeScript**。理由：
1. 类桌面交互需要组件化状态管理（窗口开关、z-index、拖拽位置），React 最自然
2. 拖拽可用 `@dnd-kit/core` 或 `@use-gesture/react`
3. 动画可用 `framer-motion` 或 `gsap`
4. 构建输出纯静态，可部署到 GitHub Pages/Vercel

---

## 三、GitHub API 同步方案调研

### 可行性结论: ✅ 可行，已确认采用

**方案概述**:
用户在前端配置 GitHub Personal Access Token（推荐 Fine-grained Token，仅授权目标 repo 的 Contents: Read & Write），前端直接调用 GitHub REST API 读写仓库中的 `webdesk-data.json` 文件。Token 存于 localStorage 独立 key，不写入数据文件。

**API 端点**:
- 读取: `GET /repos/{owner}/{repo}/contents/webdesk-data.json`（404 表示首次使用）
- 写入: `PUT /repos/{owner}/{repo}/contents/webdesk-data.json`（首次创建无需 SHA，更新需传入最新 SHA）
- 测试连通性: `GET /repos/{owner}/{repo}`（同时验证 token 有效性和仓库存在）

**约束与风险**:

| 问题 | 详情 | 缓解方案 |
|---|---|---|
| **CORS** | GitHub API 支持跨域（`Access-Control-Allow-Origin: *`），前端可直接调用 ✅ | 无需缓解 |
| **速率限制** | 认证用户 5,000 req/hour。单用户操作书签足够 ✅ | 变更后 debounce 5s 再推送，避免高频请求 |
| **Token 安全** | Token 存 localStorage，有 XSS 泄漏风险 ⚠️ | 提醒用户创建 fine-grained token（仅授权单仓库）；Token 独立存储，不进 JSON |
| **冲突处理** | 多设备同时修改同一文件会冲突（SHA 不匹配）⚠️ | 已确认方案：推送前重新 GET 最新 SHA 与内容，比较 `updatedAt` 时间戳；远端新 → 跳过并提示；本地新 → last-write-wins |
| **公开 repo** | 书签数据写入 public 仓库，任何人可见 ⚠️ | 产品内明确提示；接受该 trade-off（已确认） |
| **文件大小** | GitHub API 单文件限制 100MB；自定义壁纸 base64 会导致 JSON 膨胀 ⚠️ | 已确认：自定义壁纸（base64）不参与同步，每台设备本地设置 |
| **拉取时机** | 纯前端无法实时感知远端变更（无 WebSocket）⚠️ | 已确认：页面加载时自动拉取 + 手动同步按钮；"刷新即可看到最新数据"满足需求 |

**实现路径**（已完成）:
1. ✅ MVP 阶段：纯 localStorage，不同步
2. ✅ v1 阶段：设置面板"GitHub 同步"配置项（Token + Owner + Repo + Branch + 测试连接）
3. ✅ 同步触发：页面加载自动拉取 + 本地变更 debounce 5s 自动推送 + 手动"立即同步"按钮
4. ✅ 数据格式：`webdesk-data.json`，结构与 localStorage 同构，含 `updatedAt` 时间戳

**无现有成熟方案**:
未找到直接以"前端 GitHub API 书签同步"为核心功能的开源项目。此方案需自行封装 GitHub API 调用层。

---

## 四、拖拽交互技术调研

### 桌面图标拖拽

**方案对比**:

| 库 | 特点 | 适用性 |
|---|---|---|
| **@dnd-kit/core** | React 生态最成熟的拖拽库，支持网格、排序、多选 | ✅ 首选。适合图标网格拖拽 |
| **@use-gesture/react** | 更底层的手势库，自由度极高 | ⚠️ 适合窗口拖拽，图标拖拽需额外封装 |
| **HTML5 Drag & Drop API** | 原生 API，无需引入库 | ⚠️ 兼容性问题多，移动端支持差，不推荐 |
| **GSAP Draggable** | 动画库 GSAP 的拖拽插件，顺滑度高 | ✅ 适合窗口拖拽（配合 GSAP 动画） |

**建议**:
- **图标网格**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **窗口拖拽**: `@use-gesture/react`（轻量）或 GSAP Draggable（若已引入 GSAP）

---

## 五、书签导入技术调研

### HTML 书签文件解析

浏览器导出的书签 HTML 格式为 Netscape Bookmark File Format，结构如下：

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ADD_DATE="1234567890">GitHub</A>
        <DT><H3>开发工具</H3>
        <DL><p>
            <DT><A HREF="https://stackoverflow.com">Stack Overflow</A>
        </DL><p>
    </DL><p>
</DL><p>
```

**解析方案**:
- 浏览器环境可用 `DOMParser` 直接解析 HTML 字符串，遍历 `<DT>` 和 `<A>` 节点
- 需处理嵌套层级（`<DL>` 嵌套）、图标（`ICON` 属性）、添加日期等元数据
- menav 的 `src/bookmark-processor.ts` 已实现此逻辑，可作为参考

**结论**: 完全可行，浏览器端解析无需后端支持。

---

## 六、综合结论

| 调研项 | 结论 |
|---|---|
| **技术栈** | 推荐 **Vite + React + TypeScript**。Next.js 优势用不上，Astro 交互开发效率低。 |
| **视觉/交互参考** | viviannnl/personal-web 提供最佳 macOS 风格实现参考（Dock、Window、动画）。menav 提供部署和书签处理参考。 |
| **GitHub 同步** | 可行。前端直接调 GitHub REST API，Token 存 localStorage，JSON 文件存 repo。需自行处理冲突和速率限制。 |
| **拖拽交互** | 图标拖拽用 `@dnd-kit/core`，窗口拖拽用 `@use-gesture/react` 或 GSAP。 |
| **书签导入** | 浏览器端 `DOMParser` 解析 HTML 书签文件完全可行。 |

---

## 七、仍待验证

1. **Vite + React 静态构建后的 bundle 体积**：是否满足"轻量"目标？需 MVP 原型测试。
2. **GitHub Fine-grained Token vs Classic Token**：哪个更适合前端场景？Fine-grained 更安全但权限配置复杂。
3. **窗口管理复杂度**：设置卡片窗口的 z-index、focus、最小化/关闭状态管理，在 React 中如何最简洁实现？
4. **图标元数据获取**：书签只有 URL 和标题，如何自动获取网站的 favicon 和主题色？（可用 Google Favicon API、或 menav 的本地抓取方案）
