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

## 部署与使用（推荐：Fork 方式）

### 第 0 步：准备 GitHub 仓库

**必须先有一个仓库**，因为创建 Token 时需要指定一个仓库来授权。如果你还没有，请先 Fork 本仓库（见下），或自己新建一个空仓库。

### 第 1 步：Fork 本仓库

1. 打开本仓库页面，点击右上角 **Fork**，选到你的新账号/新仓库
2. Fork 完成后，**建议删除 fork 仓库根目录下的 `webdesk-data.json`**（那是原作者的同步数据），删除后你的数据从零开始；不删除则继承原作者的书签数据

### 第 2 步：开启 GitHub Actions 并部署

> ⚠️ Fork 出来的仓库**默认 Actions 是关闭的**，必须手动开启。

1. 进入 fork 仓库 → **Actions** 标签页 → 点击绿色按钮 **"I understand my workflows, go ahead and enable them"**（开启 GitHub Action 功能）
2. 进入 **Settings → Pages** → **Build and deployment** → Source 选择 **GitHub Actions**（**不要选 Deploy from a branch**）
3. 回到 **Actions** 标签页 → 左侧列表点击 **Deploy to GitHub Pages** → 页面出现 "This workflow has a workflow_dispatch event trigger" 提示 → 点击右侧 **Run workflow** 按钮
4. 等待约 30 秒，workflow 变绿即部署完成
5. 访问 `https://<你的用户名>.github.io/<仓库名>/`，看到 WebDesk 桌面即上线成功

### 第 3 步：创建 Token（Fine-grained Token）

1. 打开 GitHub → 右上角头像 → **Settings**
2. 左侧底部 → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. 填写以下配置：

| 配置项 | 填写 |
|---|---|
| **Token name** | 任意，如 `WebDesk` |
| **Expiration** | 建议 90 天（过期后需在 WebDesk 中重新配置） |
| **Repository access** | **Only select repositories** → 勾选你的 fork 仓库 |

5. **关键步骤**：在 **Repository permissions** 区域（注意：不是上方 *Account permissions*）找到 **Contents**，设置为 **Read and write**

> ⚠️ 常见误区：页面中有两个权限区域——
> - **Account permissions**（账号权限）：含 Email addresses、Gists、Followers 等，**不需要改动**
> - **Repository permissions**（仓库权限）：含 Contents、Issues、Pull requests 等。**必须选中仓库后才会显示**，我们需要把这里的 **Contents** 改为 **Read and write**
>
> 如果页面没有显示 Repository permissions 区域，请检查 Repository access 是否选择了 "Only select repositories"（或 "All repositories"），而不是 "Public Repositories (read-only)"。

6. 点击 **Generate token**，**立即复制**（Token 只显示一次）

### 第 4 步：在 WebDesk 中填写并同步

打开你的 WebDesk 站点 → 设置窗口 → **GitHub Sync** 区块，填写：

| 设置项 | 填写值 |
|---|---|
| **Token** | 第 3 步复制的 Token |
| **Owner** | 你的 GitHub 用户名（如 `BornfreeYan`） |
| **Repo** | 仓库名（如 `WebDesk`） |
| **Branch** | `main` |

点击 **测试连接**，显示"连接成功"即完成配置。

### 第 5 步：验证同步

- 添加或删除一个书签，等 5-10 秒
- 到你的仓库页面刷新，看到根目录 `webdesk-data.json` 的修改时间变为 "just now" 且内容同步，即配置成功

## 数据存储与同步

- 默认数据保存在浏览器 `localStorage`（key: `webdesk-data-v3`），无需任何配置
- 配置 GitHub 同步后，数据同时备份到仓库根目录的 `webdesk-data.json`
- 同步范围：书签（含文件夹层级）、图标位置、Dock 配置、主题设置
- 不同步：自定义壁纸图片（仅本地）、GitHub Token（仅本地浏览器）

### 同步原理（简要）

- **数据同步 ≠ 代码部署**：增删书签/拖图标等日常操作只通过 GitHub API 读写 `webdesk-data.json`，秒级完成；只有代码文件变更（`git push` 代码）才会触发重新构建部署，同步产生的提交不会触发部署
- **自动推送**：本地数据变更后 5 秒自动推送（无需手动点击）
- **自动拉取**：页面加载时对比云端 `updatedAt` 时间戳，云端较新则提示加载
- **冲突处理**：推送前先读取云端时间戳，云端严格更新则跳过推送（不覆盖他人改动），否则以本地为准写入（last-write-wins）；推送遇 SHA 冲突时自动重试
- **验证方法**：改动书签后等 5-10 秒，刷新仓库页面，`webdesk-data.json` 的修改时间应变为 "just now"，内容与本地一致

### ⚠️ 多设备使用注意事项（重要）

- **不要双开**：同一设备上不要同时开多个 WebDesk 标签页，不同标签页可能持有不同的本地数据，互相覆盖
- **不要同时操作**：两台设备同时编辑时，以最后成功推送者为准，另一方的改动可能被跳过。建议"编辑完等 5 秒再切换设备"
- **页面开着时不会自动收到更新**：设备 A 修改后，设备 B 需要**刷新页面**（或点"立即同步"）才能看到最新数据
- **首次打开弹"发现云端更新"是正常行为**：说明云端数据比本地新，点"加载"即同步

### ⚠️ 安全警告

- GitHub Token 保存在浏览器 `localStorage` 中，有被 XSS 窃取的风险。请勿在公共电脑/不受信任的设备上配置 Token；如确需使用，用完后在浏览器开发者工具中清除该站点的 `localStorage`（或清除浏览数据）
- Token 建议设置 90 天有效期并定期更换
- **刷新/清除浏览器数据会导致 Token 丢失**：部分设备（如平板）刷新页面即清空 `localStorage`，需要重新粘贴 Token，属正常现象，不是 bug

## 部署到自己的仓库（开发者自建）

如果你想从零搭建而非 Fork：

1. 将代码推送到你的 GitHub 仓库（`main` 分支）
2. 仓库 **Settings → Pages** → **Build and deployment** → Source 选择 **GitHub Actions**
3. 推送代码后，仓库自带的 `.github/workflows/deploy.yml` 会自动构建并部署到 Pages
4. 部署完成后访问 `https://<你的用户名>.github.io/<仓库名>/`

> ℹ️ 部署 workflow 仅在代码文件变更时触发（`src/`、配置、依赖等），日常书签数据同步（写入 `webdesk-data.json`）不会触发重新构建。

## 开发

```bash
npm run dev       # 开发模式
npm run build     # 构建到 dist/
npm run lint      # Oxlint 检查
```
