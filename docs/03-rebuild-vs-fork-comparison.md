# Rebuild vs. Build-from-Source — Final Comparison

> Decision: **Fork OpenWork** (Plan A)
> This document preserves the analysis that led to the decision.

---

## 1. The Two Candidates

| | **OpenCode** (anomalyco/opencode) | **OpenWork** (different-ai/openwork) |
|---|---|---|
| **What it is** | AI coding agent (CLI + server + beta desktop) | Desktop app wrapper for OpenCode |
| **Stars** | 142k+ | 13.6k+ |
| **License** | MIT | MIT |
| **Language** | TypeScript (58%), MDX, Rust | TypeScript, Rust (Tauri) |
| **Desktop framework** | Electron 40.4 | Tauri 2 |
| **UI framework** | SolidJS | React 19 + SolidJS hybrid |
| **Package manager** | Bun | pnpm |
| **Monorepo tool** | Turborepo | Turborepo |
| **Packages** | 19 | 8 apps + 3 packages |
| **Commits** | 11,091 | 2,269 |

---

## 2. Dimension-by-Dimension Comparison

### 2.1 Complexity

| Factor | OpenCode (Rebuild) | OpenWork (Fork) |
|--------|-------------------|-----------------|
| Codebase size | 19 packages (only 2 for desktop) | 11 units (all relevant) |
| Framework complexity | Single (SolidJS) | Hybrid (React + SolidJS) |
| Rust requirement | No (Electron) | Yes (Tauri) |
| UI to build from scratch | ~70% | ~20% |

### 2.2 Task Size

| Task | OpenCode (Rebuild) | OpenWork (Fork) |
|------|-------------------|-----------------|
| Session management UI | Build new | Exists |
| Permission system UI | Build new | Exists |
| Execution timeline | Build new | Exists |
| Template system | Build new | Exists |
| Skills/plugin manager | Build new | Exists |
| i18n (5 languages) | Build new | Exists |
| Process orchestrator | Build new | Exists |
| **Estimated effort** | **10-14 weeks** | **3-5 weeks** |

### 2.3 Licensing

Both MIT. Both compatible. Tie.

### 2.4 Expandability

| Factor | OpenCode (Rebuild) | OpenWork (Fork) |
|--------|-------------------|-----------------|
| Adding new UI panels | SolidJS only (simple) | Navigate React/Solid boundary |
| Upstream sync | Easy (same repo) | Manual (separate project) |
| Contributor barrier | Low (JS only) | Medium (JS + Rust) |
| Desktop plugin ecosystem | Electron (massive) | Tauri (growing) |
| Performance headroom | Lower (Electron) | Higher (Tauri) |

---

## 3. Scoring Matrix

| Dimension | Weight | OpenCode (Rebuild) | OpenWork (Fork) |
|-----------|--------|-------------------|-----------------|
| Complexity | 20% | 7/10 | 5/10 |
| Task size | 30% | 4/10 | 9/10 |
| Licensing | 15% | 10/10 | 10/10 |
| Expandability | 20% | 8/10 | 6/10 |
| Binary/Performance | 15% | 5/10 | 8/10 |
| **Weighted Score** | 100% | **6.3/10** | **7.6/10** |

---

## 4. Decision

### Chosen: Fork OpenWork

**Primary reasons**:
1. **3-4 month head start** on UI features (sessions, permissions, timeline, templates, skills, i18n)
2. **Tauri delivers better performance** — smaller binary (~30-50 MB vs ~150-200 MB), lower memory
3. **Skills and templates already built** — these are MVP requirements for WorkspaceAgent
4. **MIT license** is clean and compatible

**Accepted trade-offs**:
1. React/Solid hybrid adds framework complexity (manageable — document which is which)
2. Rust toolchain required for contributors (Tauri abstracts most of it)
3. Upstream sync with OpenWork is manual (acceptable — we diverge intentionally)

### When to reconsider

Reconsider the Electron/OpenCode approach if:
- The React/Solid hybrid proves unworkable for the team
- Tauri's WebView introduces critical rendering bugs
- OpenCode's desktop app exits beta and matches OpenWork's features
