# WorkspaceAgent — Implementation Plan

> Fork OpenWork → Rebrand → Customize → Ship
> Estimated timeline: 4-5 weeks to MVP

---

## Decisions Lock-In

| Decision | Value |
|----------|-------|
| **App name** | WorkspaceAgent |
| **Approach** | Fork OpenWork (Tauri 2) |
| **Priority platforms** | macOS (ARM64 + x64), Windows (x64), then Linux |
| **LLM providers** | OpenAI API + OpenAI-compatible local models |
| **Code signing** | Unsigned initially |
| **MVP features** | Sessions, permissions, timeline, templates, skills, **rich tables** |

---

## Phase 0: Fork, Clean, Build (Days 1-3)

### 0.1 Repository Setup

```bash
# Fork different-ai/openwork to jisulicious/opencode-app
# Clone locally
git clone https://github.com/jisulicious/opencode-app
cd opencode-app

# Verify build
pnpm install
pnpm dev        # Should launch Tauri desktop app
```

### 0.2 Strip Enterprise Code

- [ ] Delete `ee/` directory entirely
- [ ] Search for all `ee/` and `enterprise` imports — remove or stub:
  ```bash
  grep -r "from.*ee/" --include="*.ts" --include="*.tsx"
  grep -r "enterprise" --include="*.ts" --include="*.tsx"
  ```
- [ ] Remove enterprise-gated features from UI (look for feature flags)
- [ ] Remove any proprietary license headers (replace with MIT)

### 0.3 Strip OpenWork Branding

- [ ] `apps/desktop/src-tauri/tauri.conf.json` — change app name, identifier, window title
  ```json
  {
    "productName": "WorkspaceAgent",
    "identifier": "com.workspaceagent.app",
    "windows": [{ "title": "WorkspaceAgent" }]
  }
  ```
- [ ] `apps/desktop/src-tauri/icons/` — replace all icon sizes (generate from single SVG)
- [ ] `package.json` (root + all apps) — update name, description, author, repository URL
- [ ] Search and replace "openwork" → "workspaceagent" in config paths:
  ```bash
  grep -r "openwork" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.toml"
  ```
- [ ] Update splash/loading screens

### 0.4 Strip Telemetry & Analytics

- [ ] Search for analytics/tracking endpoints and remove:
  ```bash
  grep -r "analytics\|telemetry\|tracking\|posthog\|mixpanel\|amplitude" --include="*.ts" --include="*.tsx"
  ```
- [ ] Remove any phone-home URLs

### 0.5 Verify Clean Build

- [ ] `pnpm install` — clean install
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm dev` — app launches with new name/branding
- [ ] `pnpm build` — production build succeeds
- [ ] `pnpm test:e2e` — existing tests still pass

### 0.6 CI Setup

- [ ] Create `.github/workflows/build.yml`:
  - Trigger on push to `main` and `dev`
  - Matrix: macOS (ARM64), macOS (x64), Windows (x64), Linux (x64)
  - Steps: install deps → typecheck → build → upload artifacts
- [ ] Create `.github/workflows/release.yml`:
  - Trigger on tag push (`v*`)
  - Build all platforms → create GitHub Release → attach binaries
- [ ] **No code signing steps** — builds are unsigned

### Phase 0 Deliverables
- [ ] Clean fork builds on macOS, Windows, Linux
- [ ] All enterprise/branding/telemetry removed
- [ ] CI producing unsigned builds for all platforms

---

## Phase 1: Provider Customization + Rich Tables (Days 4-12)

### 1.1 Simplify Provider Configuration

OpenWork supports all OpenCode providers. We narrow to OpenAI + compatible:

- [ ] Locate provider configuration UI (likely in settings panel)
- [ ] Replace multi-provider picker with simplified UI:

  **Provider presets to include**:
  | Preset | Base URL | API Key Required |
  |--------|----------|-----------------|
  | OpenAI | `https://api.openai.com/v1` | Yes |
  | Ollama | `http://localhost:11434/v1` | No |
  | LM Studio | `http://localhost:1234/v1` | No |
  | Custom | User-defined | Optional |

- [ ] Add "Test Connection" button that hits `/v1/models` endpoint
- [ ] Add auto-detect for running local model servers:
  ```typescript
  async function detectLocalProviders(): Promise<ProviderConfig[]> {
    const endpoints = [
      { name: "Ollama", url: "http://localhost:11434/v1/models" },
      { name: "LM Studio", url: "http://localhost:1234/v1/models" },
    ]
    const detected: ProviderConfig[] = []
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { signal: AbortSignal.timeout(2000) })
        if (res.ok) detected.push({ name: ep.name, ... })
      } catch { /* not running */ }
    }
    return detected
  }
  ```
- [ ] Store provider config in app settings (Tauri's fs or opencode config)
- [ ] Wire provider config into OpenCode server startup flags

### 1.2 Build Rich Table Component

This is the main new feature. Agent output often includes tables that need to be more than plain markdown.

#### 1.2.1 Install Dependencies

```bash
cd apps/app
pnpm add @tanstack/react-table
```

#### 1.2.2 Create RichTable Component

Location: `packages/ui/src/components/rich-table/`

- [ ] `RichTable.tsx` — Main component wrapping TanStack Table
  ```typescript
  // Core features:
  // - Parse markdown table data into TanStack Table format
  // - Sortable columns (click header)
  // - Resizable columns (drag border)
  // - Sticky header row
  // - Horizontal scroll for wide tables
  // - Zebra striping via Tailwind
  ```

- [ ] `SortableHeader.tsx` — Column header with sort indicator
  ```typescript
  // ▲ / ▼ / ⇕ indicators
  // Click to cycle: none → asc → desc → none
  ```

- [ ] `ResizableColumn.tsx` — Drag handle between columns
  ```typescript
  // Mouse drag to resize
  // Double-click to auto-fit content width
  ```

- [ ] `TableCell.tsx` — Cell renderer supporting nested markdown
  ```typescript
  // Renders cell content through react-markdown
  // Supports: code spans, bold, italic, links, inline code
  // Syntax highlighting for code blocks in cells
  ```

- [ ] `TableToolbar.tsx` — Utility bar above table
  ```typescript
  // [Copy as Markdown] [Copy as CSV] [Copy as TSV]
  // Optional search/filter input for tables with 10+ rows
  ```

#### 1.2.3 Integrate into Markdown Pipeline

- [ ] Locate the markdown rendering component (uses `react-markdown` + `remark-gfm`)
- [ ] Override the `table`, `thead`, `tbody`, `tr`, `th`, `td` components:
  ```tsx
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      table: ({ children }) => <RichTable>{children}</RichTable>,
      // ... override th, td to pass data to RichTable
    }}
  />
  ```
- [ ] Handle edge cases:
  - Empty tables
  - Single-column tables
  - Tables with very long cell content (truncate + expand)
  - Tables within nested markdown (blockquotes, lists)

#### 1.2.4 Styling

- [ ] Match existing Tailwind + Radix Colors theme
- [ ] Light/dark mode support
- [ ] Focus states for keyboard navigation
- [ ] Print-friendly styles (no sticky header when printing)

### 1.3 Test Rich Tables

- [ ] Unit tests for table data parsing
- [ ] Visual test with various table sizes (2 cols, 10 cols, 100 rows)
- [ ] Test nested content (code blocks in cells, links in cells)
- [ ] Test copy-as-CSV with special characters (commas, quotes, newlines)
- [ ] Test keyboard navigation (Tab between cells, Enter to sort)

### Phase 1 Deliverables
- [ ] Provider config simplified to OpenAI + compatible
- [ ] Local model auto-detection working
- [ ] Rich table component complete with sort, resize, copy, filter
- [ ] Tables render beautifully in agent output

---

## Phase 2: Feature Hardening & Platform Testing (Days 13-22)

### 2.1 Core Workflow Verification

Test each workflow end-to-end on macOS first, then Windows:

- [ ] **Session lifecycle**: Create session → select project dir → send prompt → stream response → see in history → resume session → delete session
- [ ] **Agent switching**: Start with `build` agent → switch to `plan` → verify read-only behavior → switch back
- [ ] **Permissions**: Agent requests file write → permission dialog appears → approve → file written; deny → agent notified
- [ ] **Execution timeline**: Agent creates todos → timeline updates in real-time → steps show tool calls and results
- [ ] **Templates**: Create template from session → save → load in new session → execute
- [ ] **Skills**: Open skills manager → browse available → install one → verify it's active → remove it
- [ ] **Tables**: Agent outputs a table → rendered as rich table → sort columns → resize → copy as CSV

### 2.2 Provider Verification

- [ ] **OpenAI cloud**: Set API key → select GPT-4o → run coding task → verify streaming works
- [ ] **Ollama local**: Start Ollama → app auto-detects → select model → run task → verify offline-capable
- [ ] **LM Studio**: Start LM Studio server → app auto-detects → run task
- [ ] **Custom endpoint**: Enter arbitrary URL → test connection → run task
- [ ] **Provider switching**: Change provider mid-app → new sessions use new provider
- [ ] **Invalid key handling**: Enter bad API key → get clear error → don't crash

### 2.3 macOS Testing (Priority 1)

- [ ] ARM64 (Apple Silicon): Full workflow on M1/M2/M3
- [ ] x64 (Intel): Full workflow
- [ ] First-launch experience: unsigned app → right-click Open → confirm → works
- [ ] Window management: resize, minimize, full-screen, multi-monitor
- [ ] Keyboard shortcuts: Cmd+N (new session), Cmd+, (settings), Cmd+Q (quit)
- [ ] `.dmg` installer: drag to Applications → launch from Launchpad

### 2.4 Windows Testing (Priority 2)

- [ ] x64: Full workflow on Windows 10/11
- [ ] First-launch: SmartScreen warning → "More info" → "Run anyway"
- [ ] WebView2: verify bundled or auto-install on Win 10
- [ ] Installer: `.msi` install/uninstall cycle
- [ ] Keyboard shortcuts: Ctrl+N, Ctrl+, , Alt+F4

### 2.5 Linux Testing (Priority 3)

- [ ] x64 Ubuntu 22.04+: Install WebKitGTK 4.1 → run AppImage
- [ ] Verify `.deb` package installs cleanly
- [ ] Test rendering parity with macOS/Windows (WebKitGTK differences)

### 2.6 Bug Fix Pass

- [ ] Fix all P0 (crash/data loss) bugs found in testing
- [ ] Fix all P1 (broken workflow) bugs
- [ ] Document P2 (cosmetic/UX) bugs for post-MVP

### Phase 2 Deliverables
- [ ] All core workflows verified on macOS and Windows
- [ ] Linux builds functional (may have known issues)
- [ ] All P0 and P1 bugs fixed
- [ ] Provider config tested with cloud and local models

---

## Phase 3: Polish & First-Run Experience (Days 23-28)

### 3.1 First-Run Onboarding

New users need a guided setup:

- [ ] **Welcome screen**: App name, brief description, "Get Started" button
- [ ] **Provider setup**: 
  - "Do you have an OpenAI API key?" → Yes: enter key → No: "Set up a local model"
  - Auto-detect local models if running
  - "Test Connection" with spinner and success/failure feedback
- [ ] **Project selection**: "Open a project folder to get started"
- [ ] **Quick tour**: Highlight key UI areas (session panel, chat, timeline, settings)
- [ ] Store onboarding-complete flag so it doesn't repeat

### 3.2 Error States

- [ ] No OpenCode installed → clear message + install instructions
- [ ] OpenCode server crash → auto-restart with user notification
- [ ] Network down (cloud provider) → suggest local model
- [ ] Invalid API key → specific error, link to provider's key page
- [ ] No project selected → prompt to open a folder

### 3.3 UX Polish

- [ ] Loading states for all async operations (spinners, skeletons)
- [ ] Empty states for: no sessions, no templates, no skills
- [ ] Keyboard shortcut cheat sheet (Help menu or `?` key)
- [ ] System tray icon with quick status

### 3.4 Documentation

- [ ] `README.md` — Project description, install, build from source, contribute
- [ ] `CONTRIBUTING.md` — Dev setup, architecture overview, React/Solid guide
- [ ] `docs/providers.md` — How to configure each LLM provider
- [ ] Add unsigned-app instructions for macOS and Windows

### Phase 3 Deliverables
- [ ] First-run onboarding guides new users through setup
- [ ] Error states handled gracefully with actionable messages
- [ ] Documentation written for users and contributors

---

## Phase 4: Release (Days 29-32)

### 4.1 Pre-Release Checklist

- [ ] Version set to `0.1.0` in all package.json files
- [ ] CHANGELOG.md written
- [ ] All P0/P1 bugs fixed
- [ ] CI green on all platforms
- [ ] README has download links (will fill after release)
- [ ] License file is MIT

### 4.2 Build Release Artifacts

- [ ] macOS ARM64: `.dmg` (unsigned)
- [ ] macOS x64: `.dmg` (unsigned)
- [ ] Windows x64: `.msi` (unsigned)
- [ ] Linux x64: `.AppImage` + `.deb`

### 4.3 Publish

- [ ] Create GitHub Release `v0.1.0`
- [ ] Attach all platform binaries
- [ ] Write release notes with:
  - Feature highlights
  - Known issues (unsigned binary warnings)
  - Provider setup instructions
  - System requirements
- [ ] Update README with download links

### 4.4 Post-Release

- [ ] Verify auto-update mechanism points to GitHub Releases
- [ ] Test upgrade path: install v0.1.0 → publish v0.1.1 → verify update prompt
- [ ] Monitor GitHub Issues for early adopter feedback

### Phase 4 Deliverables
- [ ] v0.1.0 published on GitHub Releases
- [ ] Binaries for macOS, Windows, Linux available
- [ ] Auto-update mechanism verified

---

## Post-MVP Roadmap

### v0.2 — Enhanced Editing (Weeks 6-9)

- [ ] Inline file editor with full CodeMirror integration
- [ ] Git integration panel (status, diff, commit, branch)
- [ ] Terminal embed alongside agent output
- [ ] Multi-session tabs (side-by-side or tabbed)
- [ ] Table export to file (CSV, JSON)

### v0.3 — Collaboration & Polish (Weeks 10-13)

- [ ] Session export/import (share sessions as files)
- [ ] Debug report generation (one-click export for bug reports)
- [ ] Performance optimization pass (startup time, memory)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Additional i18n languages

### v0.4 — Ecosystem (Weeks 14-18)

- [ ] MCP server configuration panel
- [ ] Custom agent creation interface
- [ ] Plugin/extension API for third-party developers
- [ ] Homebrew tap + Scoop bucket distribution

### v1.0 — Production (Weeks 19-26)

- [ ] Code signing certificates (macOS + Windows)
- [ ] Notarized macOS builds
- [ ] Signed Windows installers
- [ ] Enterprise features (SSO, RBAC, audit logging)
- [ ] Performance benchmarking suite
- [ ] Full test coverage (unit + integration + e2e)

---

## Resource Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | Days 1-3 | Fork, clean, CI |
| Phase 1 | Days 4-12 | Provider UI, rich tables |
| Phase 2 | Days 13-22 | Test all platforms, fix bugs |
| Phase 3 | Days 23-28 | Onboarding, polish, docs |
| Phase 4 | Days 29-32 | Release v0.1.0 |
| **Total** | **~32 working days** | **~6-7 calendar weeks** |

### Prerequisites

| Requirement | Detail |
|-------------|--------|
| **Node.js** | v22+ |
| **pnpm** | v10.x |
| **Rust** | Latest stable (for Tauri) |
| **Bun** | v1.3.9+ |
| **macOS** | Xcode Command Line Tools |
| **Windows** | Visual Studio Build Tools + WebView2 |
| **Linux** | WebKitGTK 4.1 + build-essential |
