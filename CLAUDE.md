# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. The repo currently contains only `README.md` (the spec, in French), an empty `docker-compose.yml`, and an empty `.gitignore`. **No code is scaffolded yet** — no `package.json`, no build/test tooling. The first task is step 1 of the dev plan (Vite scaffold). Until that exists, there are no build/lint/test commands.

`README.md` is the authoritative spec. Read it before any feature work. UI language and user-facing strings are **French**.

## What this is

Quote/invoice ("devis"/"factures") app for a single non-technical French independent worker. Hard requirement: **100% local, offline-first, zero data leaves the device** (no backend, no server calls at runtime except opening the user's mail client).

## Planned stack (per README)

- React + Vite + TypeScript, Tailwind (mobile-first, large touch targets)
- PWA via `vite-plugin-pwa` (installable, works offline)
- Local storage: IndexedDB through **Dexie.js** (clients, devis, factures, settings)
- PDF: `pdf-lib` or `@react-pdf/renderer`, generated **client-side only**
- Email: Web Share API (`navigator.share` with PDF file); fallback = PDF download + prefilled `mailto:`
- Backup/portability: export/import all data as a single JSON file

Desktop-only alternative (only if phone usage is dropped): Tauri + SQLite + SMTP. Do not build this unless explicitly asked.

## Non-negotiable domain rules (French invoicing law)

These are legal constraints, not preferences — get them right:

- **Sequential invoice numbering with no gaps** ("numérotation séquentielle stricte sans trou"). Devis and factures have separate prefixed sequences (e.g. `DEV-2026-001`, `FAC-2026-001`).
- **An issued invoice is immutable.** Once emitted it can only be duplicated or corrected via a credit note ("avoir") that has its own numbering. No editing.
- **VAT handling** depends on the user's regime — e.g. auto-entrepreneur shows "TVA non applicable, art. 293 B du CGI". Totals must compute HT, VAT per rate, and TTC.
- **B2B vs B2C** ("pro" vs "particulier") changes obligations: B2B requires Factur-X and client SIREN/SIRET; B2C allows a plain PDF.

## Hardest part: Factur-X / electronic invoicing (2026–2027 reform)

Treat as an isolated milestone (dev step 9) with explicit XML validation:

- B2B factures export as **PDF/A-3 with an embedded CII XML** (EN 16931, **BASIC profile**) — "Factur-X".
- Use `pdf-lib` to embed the XML attachment + PDF/A-3 XMP metadata. This is the trickiest piece — build and validate it on its own.
- Also provide a raw CII XML export button, and a ZIP export of all documents (PDF + XML) for the accountant.
- The app does **not** transmit to the tax administration (impossible locally); it produces conformant files ready to import into an approved platform (PA/PDP).

## Suggested build order (from README)

Scaffold → data model + JSON export/import → company settings/onboarding → clients & service catalogue CRUD → devis/facture form with auto-calc → PDF (one template first) → email send → dashboard + statuses + devis→facture conversion → Factur-X (isolated) → polish (legal numbering, invoice lock, avoirs, ZIP export).
