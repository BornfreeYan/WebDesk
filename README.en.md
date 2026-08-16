# WebDesk

**English | [简体中文 README](README.md)**

Your desktop on the web — a personal web desktop bookmark manager with a macOS-style desktop, icons, Dock and folders, backed by free cross-device sync through your own GitHub repository.

## Features

- 🖥️ **Desktop metaphor** — free-drag icons, folder hierarchy, macOS-style Dock and settings window
- 🔖 **Bookmark management** — add, import browser HTML bookmarks, rename, delete, context menus
- 📁 **Folder organization** — nested folders, double-click to open a dedicated window
- 🌗 **Personalization** — light/dark mode, system accent colors, built-in wallpapers (custom upload supported)
- ☁️ **GitHub sync** — bookmarks, layout and settings auto-sync to your GitHub repo, restore across devices
- 🔍 **Global search** — fuzzy search across all bookmarks and folders
- 🕐 **Desktop widgets** — draggable glassmorphism clock and todo list (local only)

## Quick Start (local)

```bash
npm install
npm run dev
```

## Deploy & Use (recommended: Fork)

### Step 0: Prepare a GitHub repository

**You need a repository first**, because creating a token requires selecting a repository to authorize. Fork this repo (below), or create a new empty repo.

### Step 1: Fork this repository

1. Click **Fork** at the top-right of this page, into your own account.
2. After forking, **it is recommended to delete `webdesk-data.json`** at the repo root — it contains the original author's sync data. Delete it to start from scratch; keep it to inherit the author's bookmarks.

### Step 2: Enable GitHub Actions & deploy

> ⚠️ Forked repos have **Actions disabled by default** — you must enable them manually.

1. Go to your fork → **Actions** tab → click the green button **"I understand my workflows, go ahead and enable them"**.
2. Go to **Settings → Pages** → **Build and deployment** → Source: **GitHub Actions** (do **not** choose "Deploy from a branch").
3. Back in the **Actions** tab → click **Deploy to GitHub Pages** in the left list → you'll see "This workflow has a workflow_dispatch event trigger" → click **Run workflow** on the right.
4. Wait ~30 seconds until the workflow turns green.
5. Visit `https://<your-username>.github.io/<repo-name>/` — you should see your WebDesk desktop.

### Step 3: Create a Token (Fine-grained Token)

1. GitHub → avatar (top-right) → **Settings**
2. Scroll to the bottom-left → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Configure:

| Field | Value |
|---|---|
| **Token name** | anything, e.g. `WebDesk` |
| **Expiration** | 90 days recommended (re-configure after expiry) |
| **Repository access** | **Only select repositories** → check your fork repo |

5. **Key step**: in the **Repository permissions** section (not the *Account permissions* above it) find **Contents** and set it to **Read and write**.

> ⚠️ Common pitfall: there are two permission sections —
> - **Account permissions**: Email addresses, Gists, Followers, etc. — **leave untouched**
> - **Repository permissions**: Contents, Issues, Pull requests, etc. — **only appears after selecting a repository**. Set **Contents** to **Read and write** here.
>
> If you don't see the Repository permissions section, check that Repository access is set to "Only select repositories" (or "All repositories"), not "Public Repositories (read-only)".

6. Click **Generate token** and **copy it immediately** (shown only once).

### Step 4: Configure & sync in WebDesk

Open your WebDesk site → Settings window → **GitHub Sync** section:

| Field | Value |
|---|---|
| **Token** | the token from Step 3 |
| **Owner** | your GitHub username (e.g. `BornfreeYan`) |
| **Repo** | the repo name (e.g. `WebDesk`) |
| **Branch** | `main` |

Click **Test Connection** — "Connection OK" means it's configured.

### Step 5: Verify sync

- Add or delete a bookmark, wait 5–10 seconds.
- Refresh your repo page: `webdesk-data.json` at the repo root should show "just now" with the updated content.

## Data Storage & Sync

- Data is stored in browser `localStorage` by default (key: `webdesk-data-v3`) — zero configuration.
- With GitHub sync configured, data is also backed up to `webdesk-data.json` at the repo root.
- **Synced**: bookmarks (with folder hierarchy), icon positions, Dock config, theme settings.
- **Not synced**: custom wallpaper images (local only), GitHub Token (local browser only).
- **Local backup**: use Settings → Data → **Export bookmarks as JSON** anytime.

### Sync principles (brief)

- **Data sync ≠ code deploy**: daily operations (add/delete/drag bookmarks) only read/write `webdesk-data.json` via the GitHub API, done in seconds; only code file changes (`git push`) trigger a rebuild & redeploy — sync commits never trigger a deploy.
- **Auto push**: 5 seconds after a local change, automatically pushed (no manual click).
- **Auto pull**: on page load, compares the cloud `updatedAt` timestamp; prompts to load if the cloud is newer.
- **Conflict handling**: before pushing, reads the cloud timestamp — if the cloud is strictly newer, the push is skipped (never overwrites others' changes); otherwise local wins (last-write-wins); SHA conflicts auto-retry.
- **Verify**: after a change, wait 5–10 seconds, refresh the repo page — `webdesk-data.json` should show "just now".

### ⚠️ Multi-device notes (important)

- **No double-opening**: don't keep multiple WebDesk tabs open on the same device — tabs may hold different local data and overwrite each other.
- **No simultaneous editing**: when two devices edit at once, the last successful push wins and the other's changes may be skipped. Recommended: edit, wait 5 seconds, then switch devices.
- **No live updates**: after device A changes, device B needs to **refresh the page** (or click "Sync Now") to see the latest data.
- **"Cloud update found" prompt on first open is normal**: it means the cloud is newer; click Load to sync.

### ⚠️ Security warning

- The GitHub Token lives in browser `localStorage` and could be exposed by XSS. Do not configure a token on public/trust-compromised machines; if you must, clear the site's `localStorage` (or browsing data) afterwards.
- Set token expiry to 90 days and rotate regularly.
- **Refreshing/clearing browser data may wipe the token**: some devices (e.g. tablets) clear `localStorage` on refresh — just paste the token again. This is normal behavior, not a bug.

## Deploy to your own repo (from scratch)

1. Push the code to your GitHub repo (`main` branch).
2. Repo **Settings → Pages** → **Build and deployment** → Source: **GitHub Actions**.
3. The built-in `.github/workflows/deploy.yml` builds and deploys automatically.
4. Visit `https://<your-username>.github.io/<repo-name>/`.

> ℹ️ The deploy workflow only triggers on code file changes (`src/`, configs, dependencies, etc.) — daily bookmark data sync (writing `webdesk-data.json`) never triggers a rebuild.

## Development

```bash
npm run dev       # dev mode
npm run build     # build to dist/
npm run lint      # Oxlint checks
```

## Tech Stack

Vite · React 19 · TypeScript · Tailwind CSS · @dnd-kit · lucide-react — pure static site, no backend required.

## License

[MIT](LICENSE)
