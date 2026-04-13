# Rebuild vs. Build-from-Source Comparison

> Comparing: building a new desktop app from OpenCode vs. forking OpenWork

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
| **Releases** | 759 | 1,055 |

---

## 2. Dimension-by-Dimension Comparison

### 2.1 Complexity

| Factor | OpenCode (Rebuild) | OpenWork (Fork) |
|--------|-------------------|-----------------|
| **Codebase size** | 19 packages — large, but desktop is only 2 packages | 11 apps/packages — smaller but all relevant |
| **Framework complexity** | Single framework (SolidJS) | Hybrid (React 19 + SolidJS + Solid Router) |
| **Build system** | electron-vite (well-documented) | Vite + Tauri CLI + custom sidecar scripts |
| **Rust requirement** | No (Electron is pure JS/Node) | Yes (Tauri requires Rust toolchain) |
| **Infrastructure** | SST/Cloudflare (can ignore for desktop) | Orchestrator + server + router (must understand) |
| **UI amount to build** | ~70% must be built new | ~20% customization needed |

**Verdict**: OpenWork is more complex in framework composition (React+Solid hybrid is unusual), but OpenCode requires building more from scratch. **OpenCode wins on framework simplicity; OpenWork wins on feature completeness.**

### 2.2 Task Size

| Task | OpenCode (Rebuild) | OpenWork (Fork) |
|------|-------------------|-----------------|
| **Session management UI** | Build from scratch | Already built |
| **Permission system UI** | Build from scratch | Already built |
| **Execution timeline** | Build from scratch | Already built |
| **Template/workflow system** | Build from scratch | Already built |
| **Skills/plugin manager** | Build from scratch | Already built |
| **i18n** | Build from scratch | 5 languages done |
| **Debug exports** | Build from scratch | Already built |
| **Desktop shell** | Exists (Electron, beta) | Exists (Tauri, production) |
| **Auto-updates** | Exists (electron-updater) | Exists (tauri-plugin-updater) |
| **Process orchestration** | Build from scratch | Already built |
| **Rebranding** | N/A (fresh) | Strip branding, EE components |
| **Estimated effort** | **10-14 weeks** (2-3 devs) | **3-5 weeks** (1-2 devs) |

**Verdict**: **OpenWork wins decisively on task size** — it delivers 3-4 months of UI/UX development for free.

### 2.3 Licensing

| Aspect | OpenCode | OpenWork |
|--------|----------|----------|
| **Core license** | MIT | MIT |
| **Enterprise directory** | `packages/enterprise` (likely proprietary gate) | `ee/` (likely proprietary gate) |
| **Dependencies** | All MIT-compatible | All MIT-compatible |
| **Electron license** | MIT | N/A |
| **Tauri license** | N/A | MIT + Apache 2.0 |
| **Can we ship MIT?** | Yes | Yes (exclude `ee/` directory) |
| **Patent concerns** | None identified | None identified |

**Verdict**: **Tie** — both are MIT and fully compatible with our MIT goal. Simply exclude enterprise directories from both.

### 2.4 Expandability (UI Features, Plugins, Future Growth)

| Factor | OpenCode (Rebuild) | OpenWork (Fork) |
|--------|-------------------|-----------------|
| **UI component library** | `@opencode-ai/ui` (SolidJS, mature) | `@openwork/ui` (React+Solid, custom) |
| **Plugin/skills architecture** | OpenCode's `packages/plugin` + `packages/script` | Inherits OpenCode's plugin system + GUI manager |
| **Adding new UI panels** | SolidJS only — straightforward | Must navigate React/Solid boundary |
| **Adding new agent features** | Direct access to 19 packages | Depends on `@opencode-ai/sdk` public API |
| **Code editor integration** | CodeMirror available (used in web app) | CodeMirror + Lexical (both already integrated) |
| **Theming** | Tailwind + Radix Colors | Tailwind + Radix Colors |
| **Upstream sync** | Easy (same repo, cherry-pick) | Harder (separate project, API changes may break) |
| **Community contributions** | Lower barrier (JS only) | Higher barrier (JS + Rust) |
| **Desktop-native features** | Electron has massive plugin ecosystem | Tauri has growing but smaller ecosystem |

**Verdict**: **OpenCode wins on long-term expandability** (simpler framework, direct upstream access, lower contributor barrier). **OpenWork wins on immediate feature richness** (more UI surfaces already built).

---

## 3. Scoring Matrix

| Dimension | Weight | OpenCode (Rebuild) | OpenWork (Fork) |
|-----------|--------|-------------------|-----------------|
| **Complexity** | 20% | 7/10 (simpler framework) | 5/10 (hybrid framework) |
| **Task size** | 30% | 4/10 (build from scratch) | 9/10 (mostly done) |
| **Licensing** | 15% | 10/10 (MIT, clean) | 10/10 (MIT, clean) |
| **Expandability** | 20% | 8/10 (direct upstream) | 6/10 (SDK-coupled) |
| **Binary/Performance** | 15% | 5/10 (Electron, heavy) | 8/10 (Tauri, light) |
| | | | |
| **Weighted Score** | 100% | **6.3/10** | **7.6/10** |

---

## 4. Risk Analysis

### 4.1 OpenCode Rebuild Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large scope creep (building all UI from scratch) | High | Strict MVP scope, ship iteratively |
| Electron bundle size concerns | Medium | Tree-shaking, lazy loading |
| Beta desktop may have undiscovered bugs | Medium | Heavy testing, report upstream |
| Upstream may change desktop architecture | Low | Pin to stable release tags |

### 4.2 OpenWork Fork Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| React+Solid hybrid causes maintainability issues | High | Gradually migrate to single framework |
| Upstream OpenWork diverges, making sync painful | Medium | Maintain clean fork boundary, use SDK |
| Enterprise (ee/) removal breaks assumptions | Medium | Audit all imports before stripping |
| Tauri WebKitGTK issues on Linux distros | Medium | Document requirements, provide fallback |
| OpenCode SDK version compatibility | Medium | Pin SDK version, test on updates |

---

## 5. Recommendation

### Primary Recommendation: **Fork OpenWork** (Option C)

**Why**: The 3-4 month head start on UI features is decisive. The hybrid React/Solid complexity is manageable and can be progressively simplified. The Tauri base provides better performance characteristics than Electron.

### Conditional Alternative: **Rebuild from OpenCode** (Option A)

**When this is better**:
- If the team has strong SolidJS expertise and prefers framework purity
- If long-term upstream alignment with OpenCode is the top priority
- If the React/Solid hybrid in OpenWork proves unworkable
- If you want Electron's richer plugin ecosystem

### What We Do NOT Recommend

- **Building entirely from scratch** — too much existing work to ignore
- **Using both Electron AND Tauri** — pick one, maintain one
- **Keeping the enterprise directory** — strip it for clean MIT
