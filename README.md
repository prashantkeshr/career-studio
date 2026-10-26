# Universal Career Studio

A privacy-first, **frontend-only** platform for creating resumes and CVs in the
browser. One reusable **Career Profile** feeds many documents; a shared design
system keeps them consistent; everything is stored locally and nothing is
uploaded to any server.

> **Status: Phases 1–5 complete and runnable.**
> This is an honest, incremental build. Remaining work (standalone image/asset
> studio, optional AI assistance) is scaffolded in the feature registry as
> **Coming soon** and is *not* faked in the UI. See [Roadmap](#roadmap).

---

## What works today (Phase 1)

| Capability | Status | Notes |
|---|---|---|
| Career Profile (master content) | ✅ Available | Reused by every resume. |
| Resume editor (structured) | ✅ Available | Details, summary, experience, education, skills, projects, certifications, custom sections. |
| Live preview | ✅ Available | Updates as you type. |
| Templates | ✅ Available | **6 distinct** designs; data-driven, easy to extend. |
| Template customization | ✅ Available | Font, accent colour, heading style, text size, line height, spacing, page size, section order & visibility. |
| Direct click-to-edit | ✅ Available | Toggle **Edit on page**, click any dashed field; edits the same data as the panel. |
| Resume versions | ✅ Available | Duplicate for job-specific copies, named version snapshots (save/restore), and **compare** a snapshot with the current resume (content diff). |
| Cover letter builder | ✅ Available | Recipient, body paragraphs, design; prefilled from your profile. Export PDF / DOCX / TXT / JSON. |
| Offline & installable (PWA) | ✅ Available | Service worker caches the app shell for offline use; installable to home screen. OCR still needs the network for its model. |
| DOCX export | ✅ Available | Real `.docx` (clean single-column; not the template visual design). |
| DOCX import | ◐ Partial | Local text/structure extraction with a mandatory review step; visual formatting is not preserved. |
| Autosave | ✅ Available | Debounced writes to IndexedDB. |
| Undo / redo | ✅ Available | Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z (resume content & design). |
| Quality checks | ✅ Available | Deterministic, rule-based; guidance only. |
| PDF export | ✅ Available | Via the browser print engine (**Print → Save as PDF**). Preview matches output. |
| Plain-text export | ✅ Available | ATS-friendly `.txt`. |
| Backup & restore | ✅ Available | Full-workspace or single-resume JSON; validated on import. |
| Schema migrations | ✅ Available | Saved projects are migrated forward on load (v1 → v2). |
| PDF Studio — page ops | ✅ Available | View, reorder, rotate, delete, duplicate, extract, **merge** & **split**; export edited PDF (pdf.js + pdf-lib, non-destructive). |
| PDF annotations | ✅ Available | Text, highlight & box overlays baked into the exported PDF. Overlay only — does not remove underlying content. |
| PDF → resume reconstruction | ◐ Partial | Extracts the PDF text layer into an editable resume with a review step; layout not preserved. |
| OCR (scanned PDFs) | ◐ Partial | Optional, in-browser (tesseract.js). Downloads a language model on first use (needs internet) and may misread — review required. |
| Portfolio Studio | ✅ Available | Reusable projects with images (auto-resized); live on your Career Profile, feed any website. |
| Website Studio | ✅ Available | No-code builder: hero/about/sections, 3 templates, theme, SEO. Live preview renders the real generated HTML. |
| Static website export (ZIP) | ✅ Available | Self-contained `index.html` + CSS/JS + assets + `sitemap.xml` / `robots.txt` / `README`; runs with no backend (JSZip). |
| Responsive + light/dark | ✅ Available | Three-panel desktop; tabbed panes on mobile. |

**Not yet built (shown honestly as "Coming soon" in-app):** standalone
image/asset studio and optional AI writing assistance. Automatic cloud
publishing is intentionally **Not supported** — there is no backend (export the
ZIP and self-host).

`docx` and `mammoth` are **code-split** (dynamic import) so they load only when
you export or import a Word file, keeping the initial bundle small (~80 kB gzip).

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

- **Phase 2 — done:** direct click-to-edit on the preview, resume version
  snapshots, DOCX export, DOCX import with a review step, schema migrations,
  on-demand code-splitting for heavy libraries.
- **Phase 2 remainder (planned):** side-by-side version comparison, image/asset
  manager, cover-letter builder, smarter pagination, automated tests
  (Vitest + Playwright).
- **Phase 3 — done:** PDF Studio page operations (viewer, reorder, rotate,
  delete, duplicate, extract, merge, split, export), PDF annotations (text /
  highlight / box overlays), PDF→resume reconstruction (text layer + review),
  and optional in-browser OCR for scanned PDFs.
- **Phase 4 — done:** Portfolio Studio (reusable projects + images) and the
  no-code Website Studio with 3 templates, SEO, live iframe preview of the real
  generated HTML, and self-contained static ZIP export.
- **Phase 5 — done:** cover letter builder (PDF/DOCX/TXT), resume version
  comparison (content diff), and PWA/offline support (service worker + installable).
- **Later:** standalone image/asset studio, localization, optional AI integrations.

Features are promoted from "Coming soon" to "Available" only after they are
implemented and tested.

## Dependencies & licensing

Runtime: `react`, `react-dom` (MIT), `react-router-dom` (MIT), `idb` (ISC).
Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/*` (MIT/Apache-2.0).
All permissively licensed. Review `package.json` for exact versions.
