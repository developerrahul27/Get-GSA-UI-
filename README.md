# Get-GSA UI — Mini Challenge

## Install & Run

- Prereqs: Node 18+
- Install deps:
  - npm install
- Run dev server (Next.js):
  - npm run dev
- Open:
  - http://localhost:3000
- Build & preview:
  - npm run build && npm run start

## UX Decisions (brief)
- Clean cards with strong hierarchy: title, summary line (Agency • NAICS • Vehicle), chips for Set-Aside.
- Filters panel with modern selects, chips, inline validation, helpful helper text, and an explicit Apply action that shows skeletons (300–600ms) for perceived responsiveness.
- Keyword chipify on Enter; easy chip removal.
- Quick sort toggles sit above results for low-friction reordering.
- Drawer details include a compact stage timeline and a single primary action (Mark as Submitted) with toast feedback.

## Accessibility & State
- Every control has labels/aria and keyboard support (Selects, Combobox, Drawer). Focus rings are visible.
- Results title is a button with proper aria to open details.
- Filters: single source of truth via a shared React Context provider (`hooks/use-filters.ts`).
- Persistence: URL querystring mirrors filters; localStorage stores the last view, presets, and status overrides.
- Live updates: status overrides immediately refresh Results and the Progress Dashboard.
