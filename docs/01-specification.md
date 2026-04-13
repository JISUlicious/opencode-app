# OpenCode Desktop App — Product Specification

> Version 0.1 · April 2026

---

## 1. Vision

Build an open-source, MIT-licensed desktop application that wraps the **OpenCode** AI coding agent into a native GUI experience comparable to Claude Cowork / OpenWork — providing session management, real-time streaming output, permission controls, and an extensible plugin architecture, while preserving the full power of the underlying CLI agent.

---

## 2. Target Users

| Persona | Need |
|---------|------|
| **Solo developer** | Local-first AI coding assistant with a graphical interface instead of raw terminal |
| **Team lead** | Visibility into agent activity, permission auditing, session history |
| **Non-terminal user** | Access to OpenCode's power without CLI fluency |
| **Plugin author** | Extensible UI surface to build integrations on top of |

---

## 3. Upstream Project: OpenCode (anomalyco/opencode)

### 3.1 What It Is

OpenCode is an open-source (MIT) AI coding agent — the most popular open alternative to Claude Code — with 142k+ GitHub stars and 11k+ commits. It provides:

- **Two built-in agents**: `build` (full-access dev agent) and `plan` (read-only analysis)
- **Provider-agnostic LLM support**: Claude, OpenAI, Google, local models
- **Client/server architecture**: The core runs as a server; frontends connect over IPC/HTTP
- **Multi-frontend design**: TUI (primary), web app, desktop app (beta), VSCode extension

### 3.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (58%), MDX (38%), Rust (0.5%) |
| Runtime | Bun 1.3.11 |
| Monorepo | Turborepo v2, 19 packages |
| Infrastructure | SST (Serverless Stack) on Cloudflare, PlanetScale |
| Desktop (existing) | Electron 40.4 via `packages/desktop-electron` |
| UI framework | SolidJS + custom component library (`packages/ui`) |
| SDK | `@opencode-ai/sdk` (JS), plugin system, script system |
| Build | electron-vite, electron-builder |

### 3.3 Monorepo Packages (19)

```
packages/
├── opencode          # Core agent engine
├── app               # Web UI (SolidJS)
├── console           # TUI frontend (Ink/terminal)
├── desktop           # Desktop app (generic)
├── desktop-electron  # Electron desktop wrapper
├── sdk/              # JavaScript SDK
├── ui                # Shared component library
├── plugin            # Plugin system
├── script            # Script system
├── enterprise        # Enterprise features
├── identity          # Auth/identity
├── containers        # Container management
├── function          # Serverless functions
├── slack             # Slack integration
├── extensions/zed    # Zed editor integration
├── storybook         # Component stories
├── docs              # Documentation (MDX)
├── util              # Shared utilities
└── web               # Marketing/landing site
```

### 3.4 Existing Desktop App (Beta)

OpenCode already ships `@opencode-ai/desktop-electron` (v1.4.3):

- **Electron 40.4.1** with electron-vite build pipeline
- **SolidJS** frontend (same as web app)
- **electron-store** for persistence, **electron-updater** for auto-updates
- **node-pty** for native terminal emulation
- **electron-context-menu**, **electron-window-state** for UX polish
- Platform-specific builds for macOS (ARM64/x64), Windows, Linux

---

## 4. Functional Requirements

### 4.1 Core Features (MVP)

| ID | Feature | Description |
|----|---------|-------------|
| F1 | **Session Management** | Create, list, resume, and delete agent sessions |
| F2 | **Prompt Interface** | Rich text input with markdown support, send prompts to agents |
| F3 | **Real-time Streaming** | Live display of agent output via SSE/WebSocket |
| F4 | **Agent Switching** | Toggle between `build` and `plan` agents (Tab key equivalent) |
| F5 | **Permission System** | Surface permission requests with approve/deny UI |
| F6 | **File Diff Viewer** | Display code changes proposed by the agent |
| F7 | **Execution Timeline** | Visual representation of agent steps/todos |
| F8 | **Project Selector** | Open/switch between project working directories |
| F9 | **Provider Configuration** | Configure LLM provider, API keys, model selection |
| F10 | **Auto-updates** | Background update checks with user-controlled installation |

### 4.2 Enhanced Features (Post-MVP)

| ID | Feature | Description |
|----|---------|-------------|
| F11 | **Template System** | Save and rerun common workflows |
| F12 | **Skills/Plugin Manager** | Browse, install, manage OpenCode skills and plugins |
| F13 | **Multi-session View** | Side-by-side or tabbed multiple concurrent sessions |
| F14 | **Terminal Embed** | Inline terminal for manual commands alongside agent |
| F15 | **Git Integration** | Visual git status, commit, branch management |
| F16 | **Team Sharing** | Share sessions, export debug reports |
| F17 | **Theming** | Light/dark mode, customizable accent colors |
| F18 | **Keyboard Shortcuts** | Full keyboard-driven workflow matching TUI efficiency |
| F19 | **i18n** | Multi-language UI support |
| F20 | **Notification System** | System tray notifications for long-running tasks |

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Startup time** | < 3 seconds to interactive on mid-range hardware |
| **Memory usage** | < 300 MB idle, < 600 MB active session |
| **Binary size** | < 150 MB installer |
| **Platforms** | macOS (ARM64 + x64), Windows (x64), Linux (x64 + ARM64) |
| **Offline mode** | App launches and shows history; agent requires network for LLM |
| **Accessibility** | WCAG 2.1 AA compliance for core UI |
| **License** | MIT for all new code |

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Desktop Shell                   │
│         (Electron or Tauri)                  │
│  ┌───────────────────────────────────────┐   │
│  │           Frontend UI                 │   │
│  │     (SolidJS / React + Vite)          │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐  │   │
│  │  │Sessions │ │ Editor   │ │Config │  │   │
│  │  │ Panel   │ │ /Output  │ │Panel  │  │   │
│  │  └─────────┘ └──────────┘ └───────┘  │   │
│  └──────────────┬────────────────────────┘   │
│                 │ IPC / HTTP                  │
│  ┌──────────────▼────────────────────────┐   │
│  │        OpenCode Server                │   │
│  │    (bundled or system-installed)       │   │
│  │  ┌─────────┐ ┌──────┐ ┌──────────┐   │   │
│  │  │ Agent   │ │ SDK  │ │ Plugins  │   │   │
│  │  │ Engine  │ │ API  │ │ System   │   │   │
│  │  └─────────┘ └──────┘ └──────────┘   │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 6.1 Communication Flow

1. Desktop shell spawns OpenCode server as a child process (or connects to an existing one)
2. Frontend communicates via `@opencode-ai/sdk` over localhost HTTP
3. Real-time events streamed via SSE on `/event` endpoint
4. Permission requests surface through IPC to native dialog or in-app UI
5. File operations happen in the user's project directory (no sandbox)

---

## 7. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | **Electron** (from OpenCode) or **Tauri** (from OpenWork) | See analysis document for comparison |
| UI framework | **SolidJS** (OpenCode native) or **React** (broader ecosystem) | SolidJS preferred for consistency with upstream |
| Build system | **Vite** + **electron-vite** or **Vite** + **Tauri CLI** | Both proven in upstream projects |
| Package manager | **pnpm** or **Bun** | Match upstream choice |
| State management | **TanStack Query** for server state, signals for UI state | Proven pattern in OpenWork |
| Styling | **Tailwind CSS 4** + **Radix Colors** | Matches upstream, excellent DX |

---

## 8. Licensing

- **OpenCode upstream**: MIT License
- **OpenWork upstream**: MIT License
- **This project**: MIT License
- **Electron**: MIT License
- **Tauri**: MIT / Apache 2.0 dual license
- All chosen dependencies must be MIT-compatible (MIT, Apache 2.0, BSD, ISC)

---

## 9. Success Criteria

| Metric | Target |
|--------|--------|
| Can run a full coding session from prompt to committed code | Yes |
| Supports at least 3 LLM providers out of the box | Yes |
| Cross-platform builds pass CI | macOS, Windows, Linux |
| Plugin system functional with at least 1 example plugin | Yes |
| Auto-update mechanism working | Yes |
| Community can fork and extend within 30 minutes | Yes |
