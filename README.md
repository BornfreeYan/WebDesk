# WebDesk

个人 Web 桌面书签管理器。用 macOS 风格的桌面、图标、Dock 栏管理你的常用网站书签，通过 GitHub 仓库实现跨设备免费同步。Your desktop on the web.

## 功能特性

- 🖥️ **桌面隐喻**：图标自由拖拽、文件夹层级、macOS 风格 Dock 栏与设置窗口
- 🔖 **书签管理**：手动添加、浏览器 HTML 书签导入、重命名、删除、右键菜单
- 📁 **文件夹归纳**：创建文件夹与子文件夹，双击打开独立窗口管理
- 🌗 **个性化**：亮/暗模式、System Accent 主题色、多款内置壁纸（支持自定义上传）
- ☁️ **GitHub 同步**：书签 + 布局 + 设置自动同步到 GitHub 仓库，跨设备恢复

## 快速开始（本地运行）

```bash
npm install
npm run dev
```

## 数据存储

- 默认数据保存在浏览器 `localStorage`（key: `webdesk-data-v3`），无需任何配置
- 配置 GitHub 同步后，数据同时备份到仓库根目录的 `webdesk-data.json`
- 同步范围：书签（含文件夹层级）、图标位置、Dock 配置、主题设置
- 不同步：自定义壁纸图片（仅本地）、GitHub Token（仅本地浏览器）

### 同步原理（简要）

- **数据同步 ≠ 代码部署**：增删书签/拖图标等日常操作只通过 GitHub API 读写 `webdesk-data.json`，秒级完成，**不会触发部署 workflow**；只有 `git push` 代码变更才会触发重新构建部署
- **自动推送**：本地数据变更后 5 秒自动推送（无需手动点击）
- **自动拉取**：页面加载时对比云端 `updatedAt` 时间戳，云端较新则提示加载
- **冲突处理**：推送前先读取云端时间戳，云端严格更新则跳过推送（不覆盖他人改动），否则以本地为准写入（last-write-wins）
- **验证方法**：改动书签后等 5-10 秒，刷新仓库页面，`webdesk-data.json` 的修改时间应变为 "just now"，内容与本地一致

## GitHub 同步配置教程

### 第 1 步：创建 Token（Fine-grained Token）

1. 打开 GitHub → 右上角头像 → **Settings**
2. 左侧底部 → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. 填写以下配置：

| 配置项 | 填写 |
|---|---|
| **Token name** | 任意，如 `WebDesk` |
| **Expiration** | 建议 90 天（过期后需在 WebDesk 中重新配置） |
| **Repository access** | **Only select repositories** → 勾选你的 WebDesk 仓库 |

5. **关键步骤**：在 **Repository permissions** 区域（注意：不是上方 *Account permissions*）找到 **Contents**，设置为 **Read and write**

> ⚠️ 常见误区：页面中有两个权限区域——
> - **Account permissions**（账号权限）：含 Email addresses、Gists、Followers 等，**不需要改动**
> - **Repository permissions**（仓库权限）：含 Contents、Issues、Pull requests 等。**必须选中仓库后才会显示**，我们需要把这里的 **Contents** 改为 **Read and write**
>
> 如果页面没有显示 Repository permissions 区域，请检查 Repository access 是否选择了 "Only select repositories"（或 "All repositories"），而不是 "Public Repositories (read-only)"。

6. 点击 **Generate token**，**立即复制**（Token 只显示一次）

### 第 2 步：在 WebDesk 中填写

打开设置窗口 → **GitHub Sync** 区块，填写：

| 设置项 | 填写值 |
|---|---|
| **Token** | 第 1 步复制的 Token |
| **Owner** | 你的 GitHub 用户名（如 `BornfreeYan`） |
| **Repo** | 仓库名（如 `WebDesk`） |
| **Branch** | `main` |

点击 **测试连接**，显示"连接成功"即完成。

### 第 3 步：同步

- **立即同步**：点击设置面板的"立即同步"按钮
- **自动推送**：本地书签变更后 5 秒自动同步到云端
- **自动拉取**：页面加载时自动检查云端更新，云端较新时会提示是否加载

验证方式：添加或删除一个书签，等 5-10 秒，到仓库页面刷新，看到 `webdesk-data.json` 的修改时间变为 "just now" 且内容同步，即配置成功。

## 部署到 GitHub Pages

### 方式一：部署你自己的仓库（已推代码）

1. 将代码推送到你的 GitHub 仓库（`main` 分支）
2. 仓库 **Settings → Pages** → **Build and deployment** → Source 选择 **GitHub Actions**
3. 推送代码后，仓库自带的 `.github/workflows/deploy.yml` 会自动构建并部署到 Pages
4. 部署完成后访问 `https://<你的用户名>.github.io/<仓库名>/`

> 首次部署完成后，在任意设备打开该地址，填入你的 Token 即可同步书签数据。

### 方式二：Fork 使用（他人复用，待验证）

> ⚠️ 以下流程基于设计预期，fork 后的具体表现（如 workflow 是否自动运行）尚未实际验证，欢迎反馈。

1. **Fork 本仓库** 到自己的 GitHub 账号
2. （可选）删除 fork 仓库根目录下的 `webdesk-data.json`——那是原作者的同步数据，删除后自己的数据从零开始
3. 仓库 **Settings → Pages** → Source 选择 **GitHub Actions**，并到 **Actions** 页面手动运行一次 "Deploy to GitHub Pages" workflow（fork 的仓库不会自动触发首次构建）
4. 按上文"创建 Token"教程，为自己的 fork 仓库创建 Fine-grained Token（Contents: Read & Write）
5. 访问 `https://<你的用户名>.github.io/<仓库名>/`，在设置中填入自己的 Token / Owner / Repo / Branch，即可作为独立实例使用

> 每次 push 代码后 Pages 会自动重新部署；日常书签数据变更不触发部署，仅写入 `webdesk-data.json`。

## 开发

```bash
npm run dev       # 开发模式
npm run build     # 构建到 dist/
npm run lint      # Oxlint 检查
```
