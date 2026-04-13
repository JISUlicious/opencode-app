# WorkspaceAgent — Product Specification

> Version 0.2 · April 2026
> Decisions finalized — Fork OpenWork approach

---

## 1. Vision

**WorkspaceAgent** is an open-source (MIT), cross-platform desktop application that wraps the **OpenCode** AI coding agent into a native GUI. It provides session management, real-time streaming output, permission controls, a skills/template system, and rich content rendering — including advanced table support beyond simple markdown — while preserving the full power of the underlying CLI agent.

**Base**: Forked from [OpenWork](https://github.com/different-ai/openwork) (Tauri 2 + React/SolidJS)
**Agent engine**: [OpenCode](https://github.com/anomalyco/opencode) (MIT, 142k+ stars)
**LLM providers**: OpenAI API and OpenAI-compatible local models (Ollama, LM Studio, vLLM, etc.)

---

## 2. Target Users

| Persona | Need |
|---------|------|
| **Solo developer** | Local-first AI coding assistant with a graphical interface instead of raw terminal |
| **Team lead** | Visibility into agent activity, permission auditing, session history |
| **Non-terminal user** | Access to OpenCode's power without CLI fluency |
| **Plugin author** | Extensible UI surface to build integrations on top of |
| **Privacy-conscious dev** | Local models via OpenAI-compatible APIs (Ollama, LM Studio) |

---

## 3. Upstream Projects

### 3.1 OpenCode (anomalyco/opencode) — Agent Engine

OpenCode is an open-source (MIT) AI coding agent with 142k+ GitHub stars:

- **Two built-in agents**: `build` (full-access dev agent) and `plan` (read-only analysis)
- **Provider-agnostic LLM support**: OpenAI, Claude, Google, local models
- **Client/server architecture**: Core runs as a server; frontends connect over HTTP
- **SDK**: `@opencode-ai/sdk` for programmatic access

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (58%), MDX (38%), Rust (0.5%) |
| Runtime | Bun 1.3.11 |
| Monorepo | Turborepo v2, 19 packages |
| SDK | `@opencode-ai/sdk` (JS), plugin/script system |

### 3.2 OpenWork (different-ai/openwork) — Desktop Shell (Our Fork Base)

OpenWork is the open-source (MIT) desktop wrapper for OpenCode, using Tauri 2:

| Layer | Technology |
|-------|-----------|
| Desktop framework | Tauri 2 (Rust backend + web frontend) |
| UI framework | React 19 + SolidJS 1.9 (hybrid) |
| Build | Vite 6 + Tauri CLI |
| Monorepo | Turborepo + pnpm 10.x |
| State | TanStack React Query 5 + Solid signals |
| Styling | Tailwind CSS 4 + Radix Colors |
| Code editor | CodeMirror 6 + Lexical |
| Agent SDK | @opencode-ai/sdk v1.x |

---

## 4. Functional Requirements

### 4.1 Core Features (MVP)

| ID | Feature | Description | Source |
|----|---------|-------------|--------|
| F1 | **Session Management** | Create, list, resume, delete agent sessions | OpenWork (exists) |
| F2 | **Prompt Interface** | Rich text input with markdown, send to agents | OpenWork (exists) |
| F3 | **Real-time Streaming** | Live display of agent output via SSE | OpenWork (exists) |
| F4 | **Agent Switching** | Toggle between `build` and `plan` agents | OpenWork (exists) |
| F5 | **Permission System** | Approve/deny agent actions with granular control | OpenWork (exists) |
| F6 | **File Diff Viewer** | Display code changes with syntax highlighting | OpenWork (exists) |
| F7 | **Execution Timeline** | Visual todo/step tracking in real-time | OpenWork (exists) |
| F8 | **Project Selector** | Open/switch working directories | OpenWork (exists) |
| F9 | **Template System** | Save and rerun common workflows | OpenWork (exists) |
| F10 | **Skills/Plugin Manager** | Browse, install, manage OpenCode skills | OpenWork (exists) |
| F11 | **Provider Configuration** | Configure OpenAI + local model endpoints | Customize |
| F12 | **Rich Table Rendering** | Advanced tables beyond markdown (see F12 detail) | **Build new** |
| F13 | **Auto-updates** | Background checks, user-controlled install | OpenWork (exists) |

### 4.2 F12 Detail: Rich Table Rendering

Standard markdown tables are limited (no column spanning, no nested content, no sorting). WorkspaceAgent requires:

| Capability | Description |
|-----------|-------------|
| **Sortable columns** | Click column headers to sort ascending/descending |
| **Resizable columns** | Drag column borders to resize |
| **Column spanning** | Cells can span multiple columns |
| **Nested content** | Tables can contain code blocks, links, images |
| **Sticky headers** | Header row stays visible when scrolling long tables |
| **Copy support** | Copy table as markdown, CSV, or TSV |
| **Responsive layout** | Horizontal scroll on narrow viewports |
| **Syntax highlighting** | Code within table cells gets highlighted |
| **Search/filter** | Optional filter row for large data tables |

**Implementation approach**: Extend the markdown renderer (react-markdown + remark-gfm) with a custom table component using **TanStack Table** (headless, framework-agnostic) for interaction, rendered with the existing Tailwind + Radix design system.

### 4.3 Enhanced Features (Post-MVP)

| ID | Feature | Description |
|----|---------|-------------|
| F14 | **Multi-session Tabs** | Side-by-side or tabbed concurrent sessions |
| F15 | **Terminal Embed** | Inline terminal alongside agent output |
| F16 | **Git Integration** | Visual git status, commit, branch management |
| F17 | **Team Sharing** | Share sessions, export debug reports |
| F18 | **Theming** | Light/dark mode, customizable accent colors |
| F19 | **Keyboard Shortcuts** | Full keyboard-driven workflow |
| F20 | **i18n** | Multi-language UI (5 languages already in OpenWork) |
| F21 | **System Tray** | Status indicator, quick actions from tray |
| F22 | **MCP Server Panel** | Configure and manage MCP servers visually |

---

## 5. LLM Provider Strategy

### 5.1 Supported at Launch

| Provider | Type | Configuration |
|----------|------|--------------|
| **OpenAI** | Cloud API | API key + model selection (GPT-4o, o3, etc.) |
| **Ollama** | Local | Base URL (default: `http://localhost:11434`) + model name |
| **LM Studio** | Local | Base URL (default: `http://localhost:1234`) + model name |
| **vLLM** | Local/self-hosted | Base URL + model name |
| **Any OpenAI-compatible** | Custom | Base URL + optional API key + model name |

### 5.2 Provider Configuration UI

```
┌─ Provider Settings ─────────────────────────────┐
│                                                  │
│  Provider:  [OpenAI          ▾]                  │
│  API Key:   [sk-•••••••••••••••••] [Show] [Test] │
│  Model:     [gpt-4o          ▾]                  │
│                                                  │
│  ── OR ──                                        │
│                                                  │
│  Provider:  [Custom (OpenAI-compatible) ▾]       │
│  Base URL:  [http://localhost:11434/v1  ]        │
│  API Key:   [optional                  ]         │
│  Model:     [llama3.3:70b              ]  [Test] │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 5.3 Not Supported at Launch

- Anthropic Claude (can be added later via OpenCode's provider system)
- Google Gemini (can be added later)
- AWS Bedrock, Azure OpenAI (post-MVP)

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Startup time** | < 3 seconds to interactive on mid-range hardware |
| **Memory usage** | < 200 MB idle, < 500 MB active session (Tauri advantage) |
| **Binary size** | < 50 MB installer (Tauri advantage over Electron) |
| **Platforms** | macOS (ARM64 + x64) priority, Windows (x64) priority, Linux (x64) secondary |
| **Offline mode** | App launches and shows history; agent needs network for cloud LLM |
| **Local model mode** | Full functionality with Ollama/LM Studio (no internet needed) |
| **Accessibility** | WCAG 2.1 AA compliance for core UI |
| **License** | MIT for all new code |
| **Code signing** | Unsigned initially; add signing when certificates obtained |

---

## 7. Architecture

```
┌──────────────────────────────────────────────────────┐
│                WorkspaceAgent Desktop                 │
│                   (Tauri 2 Shell)                     │
│  ┌────────────────────────────────────────────────┐   │
│  │              Frontend UI                       │   │
│  │        (React 19 + SolidJS + Vite)             │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │   │
│  │  │ Session  │ │  Chat +   │ │  Settings +  │  │   │
│  │  │ Sidebar  │ │  Output   │ │  Skills Mgr  │  │   │
│  │  │          │ │  + Tables │ │  + Templates │  │   │
│  │  └──────────┘ └───────────┘ └──────────────┘  │   │
│  └──────────────┬─────────────────────────────────┘   │
│                 │ IPC (Tauri invoke) + HTTP            │
│  ┌──────────────▼─────────────────────────────────┐   │
│  │           Orchestrator                         │   │
│  │     (OpenCode lifecycle manager)               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │ OpenCode │ │ OpenWork │ │  OpenCode    │   │   │
│  │  │  Server  │ │  Server  │ │  Router      │   │   │
│  │  └──────────┘ └──────────┘ └──────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
│                 │ HTTP + SSE                           │
│  ┌──────────────▼─────────────────────────────────┐   │
│  │           LLM Provider                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │  OpenAI  │ │  Ollama  │ │ LM Studio /  │   │   │
│  │  │  API     │ │  Local   │ │ Custom URL   │   │   │
│  │  └──────────┘ └──────────┘ └──────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack (Finalized)

```
Desktop Shell:    Tauri 2 (Rust)
Frontend:         React 19 + SolidJS 1.9 (inherited hybrid)
Build:            Vite 6 + Tauri CLI
Monorepo:         Turborepo + pnpm 10.x
State:            TanStack React Query 5 + Solid signals
Styling:          Tailwind CSS 4 + Radix Colors
Code Editor:      CodeMirror 6 + Lexical
Rich Tables:      TanStack Table (new addition)
Markdown:         react-markdown + remark-gfm (extended)
Agent SDK:        @opencode-ai/sdk v1.x
Auto-update:      tauri-plugin-updater
Icons:            Lucide
```

---

## 9. Licensing

| Component | License | Compatible? |
|-----------|---------|-------------|
| OpenCode upstream | MIT | Yes |
| OpenWork upstream | MIT | Yes |
| Tauri | MIT + Apache 2.0 | Yes |
| TanStack Table | MIT | Yes |
| react-markdown | MIT | Yes |
| All other deps | MIT/Apache/BSD/ISC | Yes |
| **WorkspaceAgent** | **MIT** | — |

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Full coding session: prompt → code → commit | Working |
| OpenAI cloud models functional | Working |
| Local models (Ollama) functional | Working |
| Rich table rendering with sort/resize | Working |
| Skills browse/install/remove | Working |
| Template save/load/run | Working |
| macOS build (ARM64 + x64) | Working |
| Windows build (x64) | Working |
| Linux build (x64) | Working (lower priority) |
| Community can fork and extend within 30 minutes | Achievable |
