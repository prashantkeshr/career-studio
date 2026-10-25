# Universal Career Studio

A privacy-first, **frontend-only** platform for creating resumes and CVs in the
browser. One reusable **Career Profile** feeds many documents; a shared design
system keeps them consistent; everything is stored locally and nothing is
uploaded to any server.

> **Status: Phase 1 (Working Foundation) — complete and runnable.**
> This is an honest, incremental build. Later phases (PDF Studio, DOCX, Portfolio,
> Website builder) are scaffolded in the feature registry as **Coming soon** and
> are *not* faked in the UI. See [Roadmap](#roadmap).

---

## What works today (Phase 1)

| Capability | Status | Notes |
|---|---|---|
| Career Profile (master content) | ✅ Available | Reused by every resume. |
| Resume editor (structured) | ✅ Available | Details, summary, experience, education, skills, projects, certifications, custom sections. |
| Live preview | ✅ Available | Updates as you type. |
| Templates | ✅ Available | **6 distinct** designs; data-driven, easy to extend. |
| Template customization | ✅ Available | Font, accent colour, heading style, text size, line height, spacing, page size, section order & visibility. |
| Multiple versions | ◐ Partial | Duplicate a resume to tailor it per job. Richer version history is planned. |
| Autosave | ✅ Available | Debounced writes to IndexedDB. |
| Undo / redo | ✅ Available | Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z (resume content & design). |
| Quality checks | ✅ Available | Deterministic, rule-based; guidance only. |
| PDF export | ✅ Available | Via the browser print engine (**Print → Save as PDF**). Preview matches output. |
| Plain-text export | ✅ Available | ATS-friendly `.txt`. |
| Backup & restore | ✅ Available | Full-workspace or single-resume JSON; validated on import. |
| Responsive + light/dark | ✅ Available | Three-panel desktop; tabbed panes on mobile. |

**Not yet built (shown honestly as "Coming soon" in-app):** direct click-to-edit on
the preview, DOCX import/export, PDF import & reconstruction, PDF Studio
(annotate / page ops), image/asset studio, portfolio studio, website builder &
ZIP export, cover-letter builder, OCR, and optional AI writing assistance.
Automatic cloud publishing is intentionally **Not supported** — there is no backend.

## The six templates

Classic Professional · Modern Corporate · Minimalist · Executive · Academic CV ·
Technical (two-column). Each has its own layout and visual identity. Switching
templates **keeps all your content** — only the design changes.

---

## Tech stack

- **React 18 + TypeScript + Vite 5**
- **react-router-dom** with `HashRouter` (deep links & refresh work on any static host)
- **idb** for IndexedDB access
- No backend, no database, no account, no third-party runtime API.

## Prerequisites

- Node.js 18+ (built and tested on Node 24) and npm.

## Install & run

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173 by default)
```

## Build & preview a production bundle

```bash
npm run build      # typecheck (tsc --noEmit) + vite build  →  dist/
npm run preview    # serve the built dist/ locally
```

## Typecheck

```bash
npm run typecheck
```

> **Tests:** automated unit/e2e tests are planned for Phase 2 (the spec calls for
> Vitest + Playwright). Phase 1 was verified manually against the full
> create → edit → template → customize → preview → save → export workflow. No
> test suite is claimed to pass because none ships yet.

## Deploy to GitHub Pages (or any static host)

The app is fully static. For a **project page** served from a subdirectory, set the
base path at build time so asset URLs resolve:

```bash
# e.g. https://<user>.github.io/career-studio/
CS_BASE=/career-studio/ npm run build
```

On Windows PowerShell:

```powershell
$env:CS_BASE="/career-studio/"; npm run build
```

Then publish the `dist/` folder (push to a `gh-pages` branch, or use a GitHub
Action). Because routing uses `HashRouter`, refreshing a deep link never 404s and
no SPA-fallback/404.html trick is required. For a **root domain**, omit `CS_BASE`
(defaults to `/`).

---

## Data & storage

- **IndexedDB** (`career-studio` database) holds the profile and all projects.
- **localStorage** holds only tiny UI prefs (theme, Simple/Advanced mode).
- If storage is unavailable (e.g. private-browsing), the app still runs for the
  session and warns you; **export a backup before closing the tab.**
- Browser storage is **not permanent** — clearing site data erases it. Use
  **Back up everything** regularly; the JSON file is portable and restorable.

## Backup format

A backup is a single JSON object `{ kind: "career-studio-backup", schemaVersion,
exportedAt, profile, projects }`. Import validates the structure and reports
version mismatches before writing anything.

## Privacy

All processing is local. No resume content, contact details, or documents are
transmitted anywhere. There is no analytics and no network call for core
features. Any future AI assistance will be **opt-in, off by default**, and will
disclose exactly what would be sent.

## PDF export — how it works and its limits

PDF export uses the browser's own print-to-PDF. In the print dialog, choose
**Save as PDF** and turn **off** "Headers and footers" for a clean page. The
print stylesheet prints only the resume page at real A4/Letter size, so the PDF
matches the on-screen preview. A dedicated pdf-lib export path (precise margins,
font embedding) is planned for a later phase.

## Known limitations

- Multi-page documents rely on the browser's natural page breaks; an intelligent
  pagination/overflow engine (page thumbnails, manual breaks) is planned.
- No DOCX/PDF **import** yet — resumes are authored in-app or started from the
  sample data.
- Direct click-to-edit on the preview is not yet wired; edit via the structured
  panel (the preview reflects changes live).
- Reordering uses accessible up/down controls; pointer drag-and-drop is planned.

## Project structure

```
src/
  core/                 data model, factory, IndexedDB storage, feature registry, sample data
  services/
    quality/            deterministic resume checks
    exports/            JSON backup, plain-text export
  state/                app store (profile, projects, autosave, theme)
  components/
    ui/                 Icon, StatusBadge, Confirm
    layout/             AppShell (topbar + nav)
  features/
    dashboard/          projects, backup/restore, feature registry, sample loader
    career-profile/     master profile editor (reuses the resume editor)
    resume-studio/      ResumeStudio (3-panel), editor, design panel, preview, templates
  styles/               design tokens + resume template CSS + print rules
```

## Roadmap

- **Phase 2** — resume versioning & comparison, direct preview editing, DOCX
  import/export (with a review step), image/asset manager, cover-letter builder,
  smarter pagination, automated tests (Vitest + Playwright).
- **Phase 3** — PDF Studio: viewer, page operations, annotations, PDF→resume
  reconstruction, optional OCR.
- **Phase 4** — Portfolio Studio and no-code Website Studio with static ZIP export.
- **Phase 5** — advanced templates, localization, optional AI integrations, PWA/offline.

Features are promoted from "Coming soon" to "Available" only after they are
implemented and tested.

## Dependencies & licensing

Runtime: `react`, `react-dom` (MIT), `react-router-dom` (MIT), `idb` (ISC).
Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/*` (MIT/Apache-2.0).
All permissively licensed. Review `package.json` for exact versions.
