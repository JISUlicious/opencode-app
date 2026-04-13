# WorkspaceAgent — Desktop App Wrapping Analysis

> How OpenCode becomes WorkspaceAgent: a Tauri-wrapped desktop app forked from OpenWork

---

## 1. The Desktop App Pattern

Apps like Claude Cowork and OpenWork follow a consistent architecture:

| Layer | What It Does |
|-------|-------------|
| **Native shell** | Tauri/Electron window, system tray, native menus, auto-updates |
| **Web UI** | React/Solid app rendering sessions, chat, settings |
| **Orchestrator** | Spawns and manages the AI agent server process |
| **Agent server** | OpenCode running as a local HTTP server |
| **LLM backend** | Cloud API (OpenAI) or local model (Ollama) |

WorkspaceAgent follows this same pattern, forked from OpenWork's Tauri 2 implementation.

---

## 2. What OpenWork Already Provides

OpenWork gives us approximately **80% of the needed functionality** out of the box:

### 2.1 Existing Features (Keep As-Is)

| Feature | Implementation | Quality |
|---------|---------------|---------|
| Session create/list/resume/delete | `@opencode-ai/sdk` + React UI | Production |
| Real-time streaming via SSE | `/event` subscription | Production |
| Permission request/response | In-app approve/deny flow | Production |
| Execution timeline | Todo visualization component | Production |
| Template system | Local storage save/load/run | Production |
| Skills manager | Plugin browse/install/remove GUI | Production |
| Debug exports | Session data export | Production |
| Auto-updates | `tauri-plugin-updater` | Production |
| i18n | 5 languages (EN, JA, ZH, VI, PT-BR) | Production |
| Deep linking | `tauri-plugin-deep-link` | Production |
| Single instance | `tauri-plugin-single-instance` | Production |

### 2.2 What We Must Change

| Change | Effort | Description |
|--------|--------|-------------|
| **Rebranding** | Small | Name, icons, colors, config paths → WorkspaceAgent |
| **Strip enterprise** | Small | Remove `ee/` directory and all references |
| **Provider UI** | Medium | Simplify to OpenAI + OpenAI-compatible only |
| **Rich tables** | Medium | New TanStack Table component in markdown renderer |
| **Unsigned distribution** | Small | Remove code signing requirements from CI (for now) |

### 2.3 What We Must Build New

| Feature | Effort | Description |
|---------|--------|-------------|
| **Rich table component** | 3-5 days | TanStack Table integration in markdown renderer with sort, resize, sticky headers, copy-as-CSV |
| **OpenAI-focused provider panel** | 2-3 days | Simplified config for OpenAI API key + OpenAI-compatible base URL |
| **Local model discovery** | 1-2 days | Auto-detect running Ollama/LM Studio instances |

---

## 3. Architecture Mapping

### 3.1 OpenWork → WorkspaceAgent Mapping

```
OpenWork                          WorkspaceAgent
────────                          ──────────────
apps/desktop/     (Tauri shell)   → apps/desktop/     (rebrand only)
apps/app/         (React+Solid)   → apps/app/         (add rich tables, provider UI)
apps/orchestrator/(process mgr)   → apps/orchestrator/ (keep as-is)
apps/server/      (backend)       → apps/server/       (keep as-is)
packages/ui/      (components)    → packages/ui/       (add table component)
ee/               (enterprise)    → DELETED
```

### 3.2 New Component: Rich Table Renderer

```
packages/ui/src/components/
├── rich-table/
│   ├── RichTable.tsx          # TanStack Table wrapper
│   ├── SortableHeader.tsx     # Click-to-sort column headers
│   ├── ResizableColumn.tsx    # Drag-to-resize borders
│   ├── TableCell.tsx          # Markdown-aware cell renderer
│   ├── TableToolbar.tsx       # Copy, filter, export controls
│   └── index.ts
```

Integration point in markdown rendering pipeline:

```
react-markdown
  → remark-gfm (parse GFM tables)
  → custom table component override
  → RichTable (TanStack Table)
  → Tailwind styling + Radix Colors
```

### 3.3 Provider Configuration Architecture

```typescript
// Simplified provider config for WorkspaceAgent
interface ProviderConfig {
  type: "openai" | "openai-compatible"
  name: string           // Display name
  baseUrl: string        // API endpoint
  apiKey?: string        // Optional for local models
  model: string          // Model identifier
  isDefault: boolean     // Default provider for new sessions
}

// Preset providers
const PRESETS: ProviderConfig[] = [
  { type: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  { type: "openai-compatible", name: "Ollama", baseUrl: "http://localhost:11434/v1", model: "llama3.3" },
  { type: "openai-compatible", name: "LM Studio", baseUrl: "http://localhost:1234/v1", model: "" },
]
```

---

## 4. Platform-Specific Notes

### 4.1 macOS (Priority 1)

| Aspect | Detail |
|--------|--------|
| Build target | Universal binary (ARM64 + x64) |
| Installer | `.dmg` |
| Signing | **Unsigned initially** — users must right-click → Open on first launch |
| Gatekeeper | Add instructions for bypassing "unidentified developer" warning |
| Tauri deps | Xcode Command Line Tools |

### 4.2 Windows (Priority 2)

| Aspect | Detail |
|--------|--------|
| Build target | x64 |
| Installer | `.msi` (via WiX) or `.exe` (NSIS) |
| Signing | **Unsigned initially** — SmartScreen warning on first run |
| Workaround | Document "More info → Run anyway" flow for users |
| Tauri deps | Visual Studio Build Tools, WebView2 (bundled on Win 10+) |

### 4.3 Linux (Priority 3)

| Aspect | Detail |
|--------|--------|
| Build target | x64 |
| Installer | `.AppImage` (universal) + `.deb` (Ubuntu/Debian) |
| Signing | Not required on Linux |
| Tauri deps | WebKitGTK 4.1 (must document installation) |
| Known issue | WebKitGTK rendering differences from Chromium — needs testing |

---

## 5. What the React/Solid Hybrid Means in Practice

OpenWork uses a hybrid approach that requires understanding:

| Layer | Framework | Why |
|-------|-----------|-----|
| Routing | SolidJS (`@solidjs/router`) | Reactive routing with fine-grained updates |
| Data fetching | React (`@tanstack/react-query`) | Server state management |
| Virtual scrolling | Solid (`@tanstack/solid-virtual`) | Performance-critical list rendering |
| Icons | Solid (`lucide-solid`) | Tree-shakeable icon components |
| Core UI components | Both | Depends on component |
| **New table component** | **React** | TanStack Table has best React integration |

**Practical impact**: When adding new features, choose the framework based on what it integrates with. For the rich table component, React is the right choice since TanStack Table's React adapter is most mature and it lives in the markdown rendering pipeline (which uses `react-markdown`).

---

## 6. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Unsigned binaries cause user friction | Medium | Clear first-run documentation, plan to add signing later |
| React/Solid hybrid confuses contributors | Medium | Document which components use which, add contributing guide |
| OpenCode SDK version breaks | Medium | Pin SDK version, test before upgrading |
| WebKitGTK issues on Linux | Low (deprioritized) | Focus on macOS/Windows first, address Linux issues later |
| Rich table perf with large datasets | Low | Virtual scrolling via TanStack, cap initial render to 100 rows |
