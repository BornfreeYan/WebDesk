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

验证方式：点击"立即同步"后，到你的 GitHub 仓库页面刷新，能看到根目录下出现 `webdesk-data.json`。在另一台设备打开同一站点，即可看到相同的数据。

## 部署到 GitHub Pages

1. 将代码推送到你的 GitHub 仓库（`main` 分支）
2. 仓库 **Settings → Pages** → **Build and deployment** → Source 选择 **GitHub Actions**
3. 推送代码后，仓库自带的 `.github/workflows/deploy.yml` 会自动构建并部署到 Pages
4. 部署完成后访问 `https://<你的用户名>.github.io/<仓库名>/`

> 首次部署完成后，在任意设备打开该地址，填入你的 Token 即可同步书签数据。

## 开发

```bash
npm run dev       # 开发模式
npm run build     # 构建到 dist/
npm run lint      # Oxlint 检查
```
