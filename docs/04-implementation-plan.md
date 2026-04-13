# Implementation Plan — OpenCode Desktop App

> A phased plan covering both the recommended approach (Fork OpenWork) and the alternative (Rebuild from OpenCode)

---

## Plan A: Fork OpenWork (Recommended — 3-5 weeks to MVP)

### Phase 0: Setup & Fork (Days 1-3)

#### 0.1 Fork and Clean
- [ ] Fork `different-ai/openwork` to `jisulicious/opencode-app`
- [ ] Remove `ee/` (enterprise) directory entirely
- [ ] Remove OpenWork branding (logos, names, URLs)
- [ ] Audit all imports — ensure no `ee/` references remain
- [ ] Remove or replace analytics/telemetry endpoints
- [ ] Update `package.json` metadata (name, description, repository, author)
- [ ] Verify MIT license headers across all files

#### 0.2 Development Environment
- [ ] Install prerequisites: Node.js 22+, pnpm 10.x, Rust toolchain, Bun 1.3.9+
- [ ] Install platform-specific deps (WebKitGTK 4.1 on Linux, Xcode on macOS)
- [ ] Run `pnpm install` and verify clean build
- [ ] Run `pnpm dev` and verify desktop app launches
- [ ] Run `pnpm test:e2e` and verify tests pass
- [ ] Set up CI (GitHub Actions) for cross-platform builds

#### 0.3 Deliverables
- Clean fork builds and runs on all 3 platforms
- CI pipeline producing builds for macOS, Windows, Linux
- All enterprise code removed

---

### Phase 1: Rebranding & Core Customization (Days 4-10)

#### 1.1 Visual Identity
- [ ] Replace app icon (Tauri: `src-tauri/icons/`)
- [ ] Update Tauri window title in `tauri.conf.json`
- [ ] Replace splash screen / loading states
- [ ] Update color scheme via Tailwind config (optional)
- [ ] Update about/settings pages with new branding

#### 1.2 Configuration
- [ ] Rename config directories (`.openwork/` → app-specific name)
- [ ] Update default server ports if needed
- [ ] Configure auto-update URLs to point to own GitHub releases
- [ ] Set up code signing (macOS: Developer ID, Windows: EV cert)

#### 1.3 Simplify Architecture (Optional)
- [ ] Evaluate React/Solid hybrid — document which components use which
- [ ] If feasible, begin consolidating toward single framework
- [ ] Remove unused Tauri plugins if any

#### 1.4 Deliverables
- Rebranded app launches with custom identity
- Auto-updates point to own release infrastructure
- Architecture documented

---

### Phase 2: Feature Hardening (Days 11-20)

#### 2.1 Core Workflow Testing
- [ ] Test full session lifecycle: create → prompt → stream → complete
- [ ] Test permission request/response flow end-to-end
- [ ] Test agent switching (build ↔ plan)
- [ ] Test project directory selection and context scoping
- [ ] Test template save/load/run cycle
- [ ] Test skills manager: browse, install, remove plugins

#### 2.2 Platform Testing
- [ ] macOS ARM64: full workflow test
- [ ] macOS x64: full workflow test
- [ ] Windows x64: full workflow test
- [ ] Linux x64 (Ubuntu 22.04+): full workflow test
- [ ] Linux ARM64 (if targeted): full workflow test

#### 2.3 Bug Fixes & Polish
- [ ] Fix any platform-specific issues discovered
- [ ] Improve error messages for common failures (no OpenCode installed, network down)
- [ ] Add first-run onboarding: API key setup, provider selection
- [ ] Ensure keyboard shortcuts work across platforms

#### 2.4 Deliverables
- All core workflows verified on all platforms
- Known bugs documented and critical ones fixed
- First-run experience implemented

---

### Phase 3: Differentiation & Release (Days 21-30)

#### 3.1 Custom Features
- [ ] Add features that differentiate from vanilla OpenWork:
  - Enhanced project browser / recent projects list
  - Improved diff viewer with syntax highlighting
  - System tray with status indicator
  - Custom keyboard shortcut configuration
- [ ] Write user-facing documentation (README, getting started guide)

#### 3.2 Release Engineering
- [ ] Set up GitHub Releases workflow (auto-build on tag push)
- [ ] Generate signed installers for each platform:
  - macOS: `.dmg` (universal binary)
  - Windows: `.msi` or `.exe` (NSIS)
  - Linux: `.AppImage`, `.deb`
- [ ] Set up auto-update server (GitHub Releases or custom)
- [ ] Write CHANGELOG for v0.1.0

#### 3.3 Launch
- [ ] Create GitHub releases page with download links
- [ ] Publish to Homebrew tap (macOS) and Scoop bucket (Windows) (optional)
- [ ] Community announcement

#### 3.4 Deliverables
- v0.1.0 released on GitHub with signed binaries
- Auto-update functional
- Documentation published

---

## Plan B: Rebuild from OpenCode (Alternative — 10-14 weeks to MVP)

### Phase 0: Setup & Architecture (Week 1-2)

#### 0.1 Project Scaffolding
- [ ] Fork `anomalyco/opencode` or create standalone repo
- [ ] If standalone: set up monorepo with Turborepo + pnpm/Bun
- [ ] If fork: isolate work to `packages/desktop-electron` + `packages/app`
- [ ] Set up CI for cross-platform Electron builds

#### 0.2 Architecture Decisions
- [ ] Choose: extend existing Electron app vs. new Tauri app
- [ ] Choose: SolidJS (match upstream) vs. React (broader ecosystem)
- [ ] Design IPC protocol between shell and OpenCode server
- [ ] Design state management architecture
- [ ] Design component hierarchy for main UI panels

#### 0.3 Deliverables
- Monorepo builds cleanly
- Architecture decision records documented
- CI produces platform builds

---

### Phase 1: Orchestrator & Shell (Week 3-4)

#### 1.1 Process Orchestrator
- [ ] Build OpenCode server lifecycle manager:
  - Detect system-installed OpenCode CLI
  - Bundle OpenCode CLI as fallback
  - Spawn server, health check, restart on crash
  - Graceful shutdown with SIGTERM/SIGKILL
- [ ] Implement server discovery (find free port, bind to localhost)
- [ ] Implement log capture and forwarding to renderer

#### 1.2 Desktop Shell
- [ ] If Electron: configure electron-vite, window management, tray icon
- [ ] If Tauri: set up Rust project, Tauri plugins, Vite frontend
- [ ] Implement native menus (File, Edit, View, Help)
- [ ] Implement keyboard shortcuts framework
- [ ] Implement auto-update mechanism
- [ ] Implement window state persistence (size, position)

#### 1.3 Deliverables
- Desktop app launches, spawns OpenCode server, confirms health
- Native menus and keyboard shortcuts functional
- Auto-update framework in place

---

### Phase 2: Core UI — Sessions & Chat (Week 5-7)

#### 2.1 Session Management Panel
- [ ] Session list sidebar (create, select, delete, search)
- [ ] Session metadata display (project path, model, created date)
- [ ] Recent projects quick-access

#### 2.2 Chat/Prompt Interface
- [ ] Rich text input with markdown support
- [ ] Send prompt to agent via SDK
- [ ] Stream response display with SSE
- [ ] Markdown rendering with syntax highlighting
- [ ] Code block copy button
- [ ] Agent indicator (build vs. plan)
- [ ] Agent switching control

#### 2.3 SDK Integration
- [ ] Wire up `@opencode-ai/sdk` client
- [ ] Implement session CRUD operations
- [ ] Implement prompt send + SSE subscription
- [ ] Handle connection errors gracefully

#### 2.4 Deliverables
- Can create session, send prompt, see streamed response
- Session management working
- Agent switching working

---

### Phase 3: Permissions, Timeline & Config (Week 8-10)

#### 3.1 Permission System UI
- [ ] Permission request notification (toast/modal)
- [ ] Approve/deny with optional "always allow" checkbox
- [ ] Permission history view
- [ ] File write preview (show diff before approving)

#### 3.2 Execution Timeline
- [ ] Todo/step list component
- [ ] Real-time updates as agent progresses
- [ ] Expandable detail for each step (tool call, result)
- [ ] Visual indicators (pending, in-progress, completed, failed)

#### 3.3 Configuration Panel
- [ ] LLM provider selection (Claude, OpenAI, Google, local)
- [ ] API key management (secure storage via OS keychain)
- [ ] Model selection per provider
- [ ] OpenCode server settings (port, path)
- [ ] Theme selection (light/dark)

#### 3.4 Deliverables
- Full permission workflow operational
- Timeline shows real-time agent progress
- Provider/model configurable through UI

---

### Phase 4: Polish & Release (Week 11-14)

#### 4.1 Diff Viewer
- [ ] Inline diff with syntax highlighting
- [ ] Side-by-side diff mode
- [ ] Accept/reject individual changes

#### 4.2 Plugin/Skills UI
- [ ] Browse available skills
- [ ] Install/remove skills
- [ ] Configure skill settings

#### 4.3 Platform Polish
- [ ] macOS: code signing, notarization, .dmg builder
- [ ] Windows: NSIS installer, code signing
- [ ] Linux: AppImage, .deb generation
- [ ] Cross-platform testing and bug fixes

#### 4.4 Release
- [ ] GitHub Releases CI workflow
- [ ] Auto-update server setup
- [ ] README, documentation, CHANGELOG
- [ ] v0.1.0 release

#### 4.5 Deliverables
- v0.1.0 released with all core features
- Cross-platform signed binaries
- Documentation published

---

## 5. Technology Stack Summary

### Plan A (Fork OpenWork)

```
Desktop Shell:    Tauri 2 (Rust)
Frontend:         React 19 + SolidJS (existing hybrid)
Build:            Vite + Tauri CLI
Monorepo:         Turborepo + pnpm
State:            TanStack Query + Solid signals
Styling:          Tailwind CSS 4 + Radix Colors
Code Editor:      CodeMirror 6
Agent SDK:        @opencode-ai/sdk v1.x
Auto-update:      tauri-plugin-updater
```

### Plan B (Rebuild from OpenCode)

```
Desktop Shell:    Electron 40.4 (Node.js)
Frontend:         SolidJS (match upstream)
Build:            electron-vite + electron-builder
Monorepo:         Turborepo + Bun
State:            Solid signals + stores
Styling:          Tailwind CSS 4 + Radix Colors
Code Editor:      CodeMirror 6
Agent SDK:        @opencode-ai/sdk v1.x
Auto-update:      electron-updater
```

---

## 6. Resource Requirements

| Resource | Plan A (Fork) | Plan B (Rebuild) |
|----------|--------------|-----------------|
| **Developers** | 1-2 | 2-3 |
| **Timeline** | 3-5 weeks | 10-14 weeks |
| **Rust knowledge** | Basic (Tauri config) | None |
| **Design work** | Minimal (rebrand) | Significant (build all UI) |
| **Testing effort** | Moderate (verify existing) | Heavy (test all new code) |
| **CI/CD setup** | Moderate | Moderate |

---

## 7. Post-MVP Roadmap (Both Plans)

### v0.2 — Enhanced Editing (Month 2-3)
- Inline file editor with full CodeMirror
- Git integration panel (status, diff, commit)
- Terminal embed alongside agent output
- Multi-session tabs

### v0.3 — Collaboration (Month 3-4)
- Session export/import
- Team sharing via links
- Debug report generation
- Audit log for enterprise use

### v0.4 — Ecosystem (Month 4-6)
- Plugin marketplace UI
- Custom agent creation interface
- MCP server integration panel
- Extension API for third-party developers

### v1.0 — Production (Month 6-8)
- Performance optimization pass
- Accessibility audit (WCAG 2.1 AA)
- Full i18n (10+ languages)
- Enterprise features (SSO, RBAC, audit)
- Homebrew / Scoop / Snap distribution

---

## 8. Decision Checklist

Before starting, confirm:

- [ ] **Approach chosen**: Plan A (Fork OpenWork) or Plan B (Rebuild from OpenCode)?
- [ ] **App name decided**: What will the product be called?
- [ ] **Target platforms confirmed**: All three (macOS, Windows, Linux)?
- [ ] **Code signing certificates**: Do you have Apple Developer ID and Windows EV cert?
- [ ] **LLM providers to support at launch**: Which ones?
- [ ] **Distribution channel**: GitHub Releases only, or also Homebrew/Scoop?
- [ ] **Team size and availability**: Who is building this?
