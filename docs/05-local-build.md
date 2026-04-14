# Local Desktop Build Guide — WorkspaceAgent

Minimum path to a working desktop app on your machine.

## 1. Install toolchain

### macOS

```bash
xcode-select --install
brew install node@22 pnpm bun
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# accept defaults, then:
source "$HOME/.cargo/env"
rustup default stable
```

### Windows (PowerShell as admin)

```powershell
winget install OpenJS.NodeJS.LTS Microsoft.VisualStudio.2022.BuildTools Rustlang.Rustup
# In the VS Installer, check "Desktop development with C++"
npm install -g pnpm@10.27.0
iwr https://bun.sh/install.ps1 -useb | iex
rustup default stable
```

WebView2 ships with Windows 11; on Windows 10 grab the Evergreen installer from Microsoft.

### Linux (Ubuntu/Debian)

```bash
sudo apt install -y libgtk-3-dev libglib2.0-dev libayatana-appindicator3-dev \
  libsoup-3.0-dev libwebkit2gtk-4.1-dev libssl-dev librsvg2-dev libdbus-1-dev
# plus Node 22, pnpm 10.27.0, bun 1.3.9, rustup stable (same as above)
```

### Sanity check

```bash
node -v     # v22.x
pnpm -v     # 10.27.0
bun -v      # 1.3.x
rustc -V    # rustc 1.x stable
```

## 2. Clone and install

```bash
git clone https://github.com/jisulicious/opencode-app.git
cd opencode-app
git checkout claude/opencode-desktop-app-plan-YkqXE
pnpm install --frozen-lockfile
```

## 3. Pull the OpenCode sidecar

The desktop app spawns the `opencode` CLI as a Tauri sidecar. The script downloads the right archive for your OS/arch from `anomalyco/opencode` releases and drops it into `apps/desktop/src-tauri/sidecars/`.

```bash
pnpm -C apps/desktop prepare:sidecar
```

If the repo is private you'll get 403/404. In that case:

```bash
export GITHUB_TOKEN=<your_pat_with_repo_read>
pnpm -C apps/desktop prepare:sidecar
```

Version pinned in `constants.json` (currently `v1.2.27`). Override repo via `OPENCODE_GITHUB_REPO=owner/repo` if you're mirroring elsewhere.

## 4. Dev run (hot reload, fastest feedback loop)

```bash
pnpm -C apps/desktop dev
```

Launches Tauri pointing at the vite dev server. Edits to React/Solid hot-reload; Rust changes trigger a rebuild. First cold start takes a few minutes (Rust crates).

## 5. Production build (real installer)

```bash
pnpm -C apps/desktop build
```

Artifacts land in `apps/desktop/src-tauri/target/release/bundle/`:

| Platform | Bundle |
|---|---|
| macOS | `macos/WorkspaceAgent.app`, `dmg/WorkspaceAgent_0.11.207_aarch64.dmg` |
| Windows | `msi/WorkspaceAgent_0.11.207_x64_en-US.msi` (or `nsis/*.exe`) |
| Linux | `deb/*.deb`, `appimage/*.AppImage`, `rpm/*.rpm` |

## 6. Install & first launch

- **macOS:** unsigned, so right-click the `.app` → Open → "Open Anyway." Or `xattr -d com.apple.quarantine /Applications/WorkspaceAgent.app`.
- **Windows:** SmartScreen → "More info" → "Run anyway."
- **Linux:** `sudo dpkg -i *.deb` or `chmod +x *.AppImage`.

## 7. Smoke-test the Phase 1 changes

1. Settings → **Providers**: OpenAI should appear first. Add an OpenAI API key, or point a "custom" provider at a local endpoint.
2. Settings → **Local Models** → "Detect Local Models." With Ollama running locally (`ollama serve`), it should find `http://localhost:11434/v1` and list models.
3. Start a new chat, ask the assistant for a comparison table, e.g. *"Give me a markdown table comparing Python, Rust, and Go on speed, memory safety, and ecosystem."* In the reply, confirm:
   - Sortable column headers (clickable arrows)
   - Sticky header when scrolling a long table
   - **Copy MD / CSV / TSV** buttons in the toolbar copy the expected format

## Common issues

| Symptom | Fix |
|---|---|
| `tauri: command not found` | Use `pnpm -C apps/desktop dev`, not global `tauri` |
| Sidecar 403 on prepare | Set `GITHUB_TOKEN` with repo read scope |
| Blank window on launch | Check DevTools (right-click → Inspect); usually a missing env var or vite port conflict |
| Rust build fails on macOS with linker error | `xcode-select --install`, then retry |
| Windows build fails `link.exe not found` | Install "Desktop development with C++" workload in VS Build Tools |
| `WebKitGTK` missing on Linux | Install `libwebkit2gtk-4.1-dev` (not 4.0) |

## Speed tips

- `pnpm -C apps/desktop dev` is much faster iteration than `build`. Only use `build` when you want a real installer to test.
- Set `CARGO_INCREMENTAL=1` in your shell to speed up repeated Rust builds.
- Prebuilt sidecar lives in `apps/desktop/src-tauri/sidecars/` — don't delete unless you need to refresh it.
