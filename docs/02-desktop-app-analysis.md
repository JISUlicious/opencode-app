# Desktop App Wrapping Analysis

> How to turn OpenCode into a desktop application like Claude Cowork / OpenWork

---

## 1. What Claude Cowork / OpenWork Does

Claude Cowork (Anthropic's product) and OpenWork (the open-source alternative) share a common UX pattern:

| Capability | Description |
|-----------|-------------|
| **Agent orchestration** | Manages an AI coding agent (Claude Code / OpenCode) as a background process |
| **Session UI** | Create sessions, send prompts, view streamed responses in a chat-like interface |
| **Permission gating** | Agent requests for file writes, shell commands, etc. surface as approve/deny dialogs |
| **Execution timeline** | Visual representation of what the agent is doing (todos, tool calls) |
| **Rich output** | Markdown rendering, syntax-highlighted code blocks, inline diffs |
| **Project context** | Automatically scopes the agent to a working directory |
| **Template/skill system** | Save reusable workflows and install community plugins |
| **Desktop-native** | System tray, native menus, keyboard shortcuts, auto-updates |

The core pattern is: **a native desktop shell hosting a web UI that communicates with a local agent server**.

---

## 2. What Already Exists in OpenCode

OpenCode's monorepo already contains most of the building blocks:

### 2.1 Existing Desktop Infrastructure

| Component | Package | Status |
|-----------|---------|--------|
| Electron shell | `packages/desktop-electron` | Beta, shipping |
| Web UI (SolidJS) | `packages/app` | Production |
| Component library | `packages/ui` | Production |
| JavaScript SDK | `packages/sdk` | Production (v1.x) |
| Plugin system | `packages/plugin` | Production |
| Auto-updates | `electron-updater` | Integrated |

### 2.2 What OpenCode's Desktop Already Has

- **Electron 40.4** with electron-vite build
- **SolidJS** frontend (same code as the web app)
- **node-pty** for native terminal emulation
- **electron-store** for local persistence
- **electron-window-state** for window management
- Platform-specific builds via electron-builder
- Context menus, logging, auto-updates

### 2.3 Gaps to Fill (What OpenWork Adds Beyond OpenCode Desktop)

| Gap | Description | OpenWork's Solution |
|-----|-------------|-------------------|
| **Orchestrator** | Process lifecycle management for the agent server | Dedicated `apps/orchestrator` package |
| **Permission UI** | Rich in-app permission request/response flow | Custom permission components |
| **Session management UI** | Create/switch/delete sessions visually | Full session panel |
| **Execution timeline** | Visual todo/step tracking | Timeline component |
| **Template system** | Save and rerun workflows | Local storage templates |
| **Skills manager** | Browse/install/manage plugins via GUI | Skills management panel |
| **Debug exports** | Export session data for troubleshooting | Export functionality |
| **i18n** | Multi-language support | 5 languages supported |
| **Host/Client modes** | Connect to local or remote servers | Mode switching UI |

---

## 3. Architecture Options

### Option A: Extend OpenCode's Existing Electron App

**Approach**: Fork OpenCode, enhance `packages/desktop-electron` and `packages/app` with the missing UI features.

```
opencode (fork)
├── packages/
│   ├── desktop-electron/   ← Enhance shell (orchestrator, tray, etc.)
│   ├── app/                ← Add session mgmt, permissions, timeline UI
│   ├── ui/                 ← Extend component library
│   └── ...existing packages
```

**Pros**:
- Stays within OpenCode's ecosystem — automatic upstream updates
- SolidJS UI already built and working
- Electron infrastructure proven and shipping
- All 19 packages available (SDK, plugins, etc.)
- Same language/runtime throughout (TypeScript/Bun)

**Cons**:
- Electron = larger binary (~150-200 MB) and higher memory (~200-400 MB)
- Must build orchestrator, permission UI, timeline from scratch
- OpenCode's desktop is still beta — may have rough edges
- Tightly coupled to OpenCode's monorepo structure

### Option B: Build a New Tauri Shell (OpenWork Pattern)

**Approach**: Create a new Tauri-based desktop app that wraps OpenCode, following OpenWork's architecture.

```
opencode-desktop (new repo)
├── apps/
│   ├── desktop/        ← Tauri shell (Rust)
│   ├── app/            ← React/Solid UI
│   └── orchestrator/   ← Process manager
├── packages/
│   └── ui/             ← Component library
```

**Pros**:
- Tauri = smaller binary (~20-40 MB), lower memory (~50-150 MB)
- Clean architecture not burdened by OpenCode's 19-package monorepo
- Can cherry-pick best patterns from both OpenCode and OpenWork
- Rust backend for system operations (file watching, process management)

**Cons**:
- Must build the full UI from scratch (or port from OpenWork)
- Tauri requires Rust toolchain for contributors
- WebKitGTK dependency on Linux (must be installed separately)
- Smaller ecosystem than Electron for desktop-specific needs

### Option C: Fork OpenWork and Customize

**Approach**: Fork different-ai/openwork, rebrand, and customize.

```
openwork (fork)
├── apps/
│   ├── desktop/        ← Tauri shell (already built)
│   ├── app/            ← React+Solid UI (already built)
│   └── orchestrator/   ← Already built
├── packages/
│   └── ui/             ← Already built
```

**Pros**:
- Most features already implemented (sessions, permissions, timeline, templates, i18n)
- Tauri desktop shell fully functional
- Months of development work available immediately
- MIT licensed — full freedom to modify

**Cons**:
- Hybrid React/Solid codebase adds complexity
- Tied to OpenWork's architectural decisions
- Must strip/replace enterprise (`ee/`) components
- Dependency on OpenWork maintainers for upstream compatibility
- Complex dependency tree (Solid + React + Tauri + OpenCode SDK)

---

## 4. Recommendation Summary

| Criterion | Option A (Extend Electron) | Option B (New Tauri) | Option C (Fork OpenWork) |
|-----------|---------------------------|---------------------|------------------------|
| Time to MVP | 6-8 weeks | 10-14 weeks | 3-5 weeks |
| Binary size | ~150-200 MB | ~20-40 MB | ~30-50 MB |
| Memory usage | ~200-400 MB | ~50-150 MB | ~60-200 MB |
| Code complexity | Medium | Medium | High (hybrid frameworks) |
| Upstream sync | Easy (same repo) | Manual | Manual |
| UI features at start | ~30% | 0% | ~80% |
| Contributor barrier | Low (JS only) | Medium (JS + Rust) | Medium (JS + Rust) |

---

## 5. Key Technical Considerations

### 5.1 OpenCode Server Communication

Both approaches use `@opencode-ai/sdk` to communicate with the OpenCode server:

```typescript
import { createClient } from "@opencode-ai/sdk/v2/client"

const client = createClient({ baseUrl: "http://127.0.0.1:PORT" })

// Create session
const session = await client.session.create({ path: "/project/dir" })

// Send prompt
await client.session.chat({ sessionId: session.id, content: "Fix the bug in auth.ts" })

// Subscribe to events (SSE)
const events = client.session.subscribe({ sessionId: session.id })
for await (const event of events) {
  // Render streaming output
}
```

### 5.2 Process Lifecycle

The desktop app must manage the OpenCode server process:

1. **Startup**: Detect or install OpenCode CLI → spawn server → wait for health check
2. **Runtime**: Monitor process health, restart on crash, pipe logs
3. **Shutdown**: Graceful SIGTERM → wait → SIGKILL if needed
4. **Updates**: Check for new OpenCode versions, prompt user to update

### 5.3 Platform-Specific Concerns

| Platform | Consideration |
|----------|--------------|
| **macOS** | Code signing + notarization required for distribution, universal binary (ARM64+x64) |
| **Windows** | NSIS/MSI installer, Defender SmartScreen bypass via signing |
| **Linux** | AppImage/deb/rpm, WebKitGTK 4.1 dependency for Tauri |
