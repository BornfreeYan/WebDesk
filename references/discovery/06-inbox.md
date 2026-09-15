# 06 — Inbox 待看收件箱（v1.2）

> 记录本次功能的设计决策、被否掉的备选方案及原因。后续若有人重提「Inbox 是不是该独立存储」，先读这里。

## 要解决的问题

想「稍后再看」一个链接时，现状是：B 站进收藏夹、YouTube 进稍后观看、X 进书签，各自为政，之后要逐个平台翻。目标是在 WebDesk 上有一个统一的 Inbox：复制链接 → 粘进去 → 完事。

## 两个偷懒方案为什么不行

1. **贴进待办组件**：`TodoItem` 只有 `{ id, text, done }`，纯文本、不可点击。链接贴进去就是死文本，要看还得再复制出来。它是停车场，不是 Inbox。
2. **建一个叫 Inbox 的文件夹再拖进去**：改动前 `handleAddBookmark` 只往桌面根层追加，`FolderWindow` 只提供「新建子文件夹」，**没有任何入口能把链接直接加进一个文件夹**。实际要走：Dock `+` → 必填 Name → 填 URL → Enter → 图标落到桌面 → 再拖进 Inbox 文件夹。五六个动作还强制起名——正是要消除的那类摩擦。

## 关键决策：数据放哪

| 方案 | 同步 | 导出 JSON | 全局搜索 | favicon / 点击打开 | 移入其它文件夹 | 结论 |
|---|---|---|---|---|---|---|
| 存在 `webdesk-widgets-v1`（像时钟/待办那样） | ❌ | ❌ | ❌ | 需重写 | 需重写 | **否** |
| 存在书签树内一个被指定的文件夹 | ✅ | ✅ | ✅ | 复用 | 复用 | **采用** |

否掉独立存储的三个具体理由：

1. **导出备份不含小组件**：`handleExportData` 导出的是 `DesktopData`，`webdesk-widgets-v1` 不在其中。清浏览器数据或换浏览器时，书签能从 GitHub 回来，Inbox 静默消失。
2. **搜索看不见**：`SearchBar` 只吃书签树。攒到几十条后不能搜是个硬伤。
3. **累积型数据不该放临时型存储**：PRD 里「时钟/待办不同步」是合理取舍（随手记、用完就删），但 Inbox 是越攒越有价值的资产。项目主打跨设备同步，把最能留人的数据放在最不耐久的存储里不划算。

采用文件夹方案后，**`useSync.ts` 一行都不用改**：书签整树参与同步，settings 走展开合并，`note` / `createdAt` / `inboxFolderId` 自动跟着走。额外收益是「打开全部 Inbox」不需要新写视图——直接复用 `openFolderWindow` 打开那个文件夹，网格、右键重命名/删除/移动、递归删除全都有。

## 落地形态

- **数据**：`settings.inboxFolderId` 指向书签树里的一个普通文件夹，首次入库时懒创建；条目是普通 `Bookmark`，带可选 `note` 与 `createdAt`。
- **视图**：`InboxWidget` 只是视图——最近 3 条 + 待看数量徽标 + Add / All 两个入口。它不拥有数据。
- **捕获**：`AddToInboxDialog`，URL 框自动聚焦，一次 Enter 入库；名称由 URL 推导（去协议与 `www.`、保留路径，让同站多条彼此可区分）；备注可选，Tab 过去写。

## 实现时踩到的坑

- **存量 `webdesk-widgets-v1` 没有 `inbox` 字段**：直接读会拿到 `undefined` 让桌面白屏；写入侧同样要归一化，否则 `{ ...prev.inbox, ...pos }` 会丢掉 `enabled`，组件被永久关闭。因此 `App.tsx` 的 `normalizeWidgets` 在读写两侧都要用。**以后再加组件字段，必须同步改这里。**
- **不要自动读剪贴板**：`navigator.clipboard.readText()` 需要用户手势，窗口 focus 时自动读会被浏览器拒绝。输入框自动聚焦 + 用户自己 Ctrl+V 最稳；额外提供点击式 Paste 按钮（有点击手势，合法）。
- **组件行内要 `stopPropagation`**：`useWidgetDrag` 在卡片级监听 `pointerdown`，列表行的点击必须阻止冒泡，否则点链接会变成拖组件（`TodoWidget` 已踩过同一个坑）。
- **`Bookmark.position` 是必填**：文件夹内条目的坐标无意义，统一写 `{ x: 0, y: 0 }`。

## 已知限制（有意保留）

- **同步冲突提示可能覆盖刚入库的条目**：`useSync` 的 `pendingRemote` 在其它设备更新时会提示「Cloud data updated. Load?」，点 Load 整份替换本地数据，可能冲掉刚粘贴的一条。属既有行为，本轮不改同步逻辑。
- **`webdesk-data.json` 体积**：走 GitHub Contents API，实用上限约 1MB。Inbox 长期不清理会缓慢增长。
- **桌面会多出 Inbox 文件夹图标**：这是设计选择而非缺陷——它同时也是「打开全部」的入口，可钉到 Dock。

## 本轮不做

- 书签小工具（bookmarklet）、桌面全局粘贴捕获：bookmarklet 还需处理收到的 URL 校验，以及「云端更新提示」覆盖新条目的顺序问题
- 文件夹窗口内直接添加链接：本轮由捕获窗口覆盖同一需求，通用化留给后续
- Dock 图标未读角标：本轮用「组件数量徽标 + 右上角计数器」表达
