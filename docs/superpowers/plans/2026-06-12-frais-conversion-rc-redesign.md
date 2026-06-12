# Frais, conversion devis→facture, assurance RC, redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an expense journal with receipt photos, one-click devis→facture conversion, a civil-liability (RC Pro) insurance mention, and a full indigo redesign — all fully local/offline, no new runtime dependency.

**Architecture:** Existing PWA: React 19 + Vite + TypeScript + Tailwind v4, IndexedDB via Dexie, PDF via `@react-pdf/renderer`. We extend the Dexie schema to `version(2)` (new `frais` table + optional insurance fields), add pure helpers (TVA déductible, `factureDepuisDevis`) covered by unit tests, two new Frais pages, a conversion action, an insurance settings section + PDF footer, and a presentational reskin (indigo accent, carded inputs, 6-tab icon nav).

**Tech Stack:** React 19, react-router-dom 7, Dexie 4, `dexie-react-hooks`, Tailwind v4, `@react-pdf/renderer`. Tests: **Vitest** (dev-only, never bundled, runs offline). No new runtime/app dependency.

---

## Constraints (carry into every task)

- **No new runtime dependency.** Only Vitest is added, as a `devDependency` (test tooling, not shipped, no network).
- **Offline-only.** No `fetch`/network. Receipt photos use `<input type="file" capture>` + canvas (`lib/image.ts`); nothing is uploaded.
- **Dexie `version(2)`** is an internal IndexedDB schema number — local, no data loss, unrelated to app/email versioning.
- **Backup JSON stays `version: 1`** with an *optional* `frais` field, so old backups still import.
- **Conventional commits.** End each commit body with the `Co-Authored-By` trailer used in this repo.

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `vitest` devDep + `test` script |
| `vitest.config.ts` | Create | Node test env config |
| `src/db/types.ts` | Modify | `CategorieFrais`, `Frais`, insurance fields |
| `src/db/db.ts` | Modify | `frais` table, `version(2)`, default insurance |
| `src/db/calculs.ts` | Modify | `montantTvaDeductible` helper |
| `src/db/calculs.test.ts` | Create | Helper unit test |
| `src/lib/frais.ts` | Create | `fraisVide`, `labelCategorie`, `CATEGORIES` |
| `src/lib/document.ts` | Modify | `factureDepuisDevis` |
| `src/lib/document.test.ts` | Create | Conversion unit test |
| `src/db/sauvegarde.ts` | Modify | Export/import `frais` |
| `src/components/champs.tsx` | Rewrite | Indigo, bigger inputs, carded `Section` |
| `src/components/icones.tsx` | Create | 6 inline SVG nav icons |
| `src/app/Layout.tsx` | Rewrite | 6-tab icon nav, app background |
| `src/index.css` | Modify | Body background `#f7f8fc` |
| `src/pages/Documents.tsx`, `Clients.tsx`, `Catalogue.tsx`, `Parametres.tsx`, `EditeurDocument.tsx`, `components/LignesEditeur.tsx` | Modify | blue→indigo swap |
| `src/app/router.tsx` | Modify | `/frais` routes |
| `src/pages/Frais.tsx` | Create | Expense list |
| `src/pages/EditeurFrais.tsx` | Create | Expense form + photo |
| `src/pages/Accueil.tsx` | Rewrite | "Frais du mois" card |
| `src/pages/EditeurDocument.tsx` | Modify | "Convertir en facture" button |
| `src/pages/Parametres.tsx` | Modify | "Assurance RC" section |
| `src/pdf/DocumentPDF.tsx` | Modify | Insurance footer line |

---

## Task 1: Vitest setup (dev-only test runner)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/sanity.test.ts` (temporary)

- [ ] **Step 1: Install Vitest as a devDependency**

Run: `npm install -D vitest@^3`
Expected: `vitest` appears under `devDependencies`, no runtime deps changed.

- [ ] **Step 2: Add the `test` script**

In `package.json`, add to `"scripts"`:

```json
    "test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create a sanity test**

`src/sanity.test.ts`:

```ts
import { expect, test } from 'vitest'

test('vitest runs', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Delete the sanity test and commit**

```bash
rm src/sanity.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest dev-only test runner"
```

---

## Task 2: Types + Dexie v2 migration + insurance defaults

**Files:**
- Modify: `src/db/types.ts`
- Modify: `src/db/db.ts`

- [ ] **Step 1: Add `CategorieFrais` and `Frais` to `types.ts`**

Add after the `Unite` type (around line 8):

```ts
/** Catégorie d'un frais professionnel. */
export type CategorieFrais =
  | 'carburant'
  | 'repas'
  | 'materiel'
  | 'fournitures'
  | 'deplacement'
  | 'autre'
```

Add at the end of the file:

```ts
/** Frais professionnel saisi par l'utilisateur, avec photo du reçu. */
export interface Frais {
  id?: number
  /** Date du frais (timestamp ms). */
  date: number
  libelle: string
  montantTTC: number
  /** Taux de TVA en pourcentage (ex : 20, 10, 5.5, 0). */
  tauxTva: number
  /** Si false, la TVA n'est pas déductible (montant déductible = 0). */
  tvaRecuperable: boolean
  categorie: CategorieFrais
  /** Photo du reçu encodée en data URL (compressée, stockée en local). */
  photo?: string
  createdAt: number
}
```

- [ ] **Step 2: Add insurance fields to `ParametresEntreprise`**

In `ParametresEntreprise`, after `iban: string` (line 48):

```ts
  // Assurance responsabilité civile professionnelle (mention obligatoire pour
  // certaines professions ; affichée en bas du PDF si renseignée).
  assuranceRC?: string
  assuranceContrat?: string
  assuranceCouverture?: string
```

- [ ] **Step 3: Add insurance fields to `SnapshotEmetteur`**

In `SnapshotEmetteur`, after `iban: string` (line 111):

```ts
  assuranceRC?: string
  assuranceContrat?: string
  assuranceCouverture?: string
```

- [ ] **Step 4: Register the `frais` table and bump to `version(2)` in `db.ts`**

In `db.ts`, import `Frais`:

```ts
import type {
  Client,
  Document,
  Frais,
  ParametresEntreprise,
  PrestationCatalogue,
} from './types'
```

Add the table field to the class (after `documents!`):

```ts
  frais!: Table<Frais, number>
```

Add a `version(2)` block right after the existing `version(1)` block (keep v1 intact):

```ts
    this.version(2).stores({
      // Tables existantes inchangées + nouvelle table frais.
      frais: '++id, date, categorie',
    })
```

- [ ] **Step 5: Default the insurance fields in `parametresParDefaut()`**

In the returned object, after `iban: '',`:

```ts
    assuranceRC: '',
    assuranceContrat: '',
    assuranceCouverture: '',
```

- [ ] **Step 6: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/db/types.ts src/db/db.ts
git commit -m "feat: add frais type + dexie v2 schema + insurance fields"
```

---

## Task 3: TVA déductible helper (TDD)

**Files:**
- Modify: `src/db/calculs.ts`
- Create: `src/db/calculs.test.ts`

- [ ] **Step 1: Write the failing test**

`src/db/calculs.test.ts`:

```ts
import { expect, test } from 'vitest'
import { montantTvaDeductible } from './calculs'

test('TVA déductible sur 120 € TTC à 20 % = 20 €', () => {
  expect(montantTvaDeductible(120, 20, true)).toBe(20)
})

test('TVA non récupérable → 0', () => {
  expect(montantTvaDeductible(120, 20, false)).toBe(0)
})

test('taux 0 → 0', () => {
  expect(montantTvaDeductible(100, 0, true)).toBe(0)
})

test('arrondi à 2 décimales (110 € TTC à 5,5 %)', () => {
  expect(montantTvaDeductible(110, 5.5, true)).toBe(5.73)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/db/calculs.test.ts`
Expected: FAIL — `montantTvaDeductible` is not exported.

- [ ] **Step 3: Implement the helper**

Append to `src/db/calculs.ts`:

```ts
/**
 * Montant de TVA déductible d'un frais TTC. Renvoie 0 si la TVA n'est pas
 * récupérable. Arrondi monétaire à 2 décimales.
 */
export function montantTvaDeductible(
  montantTTC: number,
  tauxTva: number,
  recuperable: boolean,
): number {
  if (!recuperable || tauxTva <= 0) return 0
  const ht = montantTTC / (1 + tauxTva / 100)
  return arrondi(montantTTC - ht)
}
```

(`arrondi` already exists at the bottom of the file.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/db/calculs.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/calculs.ts src/db/calculs.test.ts
git commit -m "feat: add montantTvaDeductible helper with tests"
```

---

## Task 4: `factureDepuisDevis` conversion helper (TDD)

**Files:**
- Modify: `src/lib/document.ts`
- Create: `src/lib/document.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/document.test.ts`:

```ts
import { expect, test } from 'vitest'
import { factureDepuisDevis } from './document'
import type { Document } from '../db/types'

function devisExemple(): Document {
  return {
    id: 7,
    type: 'devis',
    statut: 'envoye',
    clientId: 3,
    lignes: [
      { libelle: 'Presta', quantite: 2, prixUnitaireHT: 100, unite: 'jour', tauxTva: 20 },
    ],
    remiseGlobalePourcent: 10,
    dateCreation: 1_000,
    dateValidite: 2_000,
    verrouille: false,
    updatedAt: 1_000,
  }
}

test('crée une facture brouillon liée au devis', () => {
  const f = factureDepuisDevis(devisExemple())
  expect(f.type).toBe('facture')
  expect(f.statut).toBe('brouillon')
  expect(f.devisOrigineId).toBe(7)
  expect(f.clientId).toBe(3)
  expect(f.remiseGlobalePourcent).toBe(10)
  expect(f.verrouille).toBe(false)
  expect(f.id).toBeUndefined()
  expect(f.numero).toBeUndefined()
})

test('copie les lignes en profondeur (pas de référence partagée)', () => {
  const devis = devisExemple()
  const f = factureDepuisDevis(devis)
  f.lignes[0].quantite = 99
  expect(devis.lignes[0].quantite).toBe(2)
})

test('pose une date d’échéance à +30 jours', () => {
  const f = factureDepuisDevis(devisExemple())
  const jours = (f.dateEcheance! - f.dateCreation) / 86_400_000
  expect(Math.round(jours)).toBe(30)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/document.test.ts`
Expected: FAIL — `factureDepuisDevis` is not exported.

- [ ] **Step 3: Implement the helper**

In `src/lib/document.ts`, add `Document` to the type import, then append:

```ts
/**
 * Construit (sans la persister) une facture brouillon à partir d'un devis :
 * reprend client, lignes et remise globale. Le numéro reste vide (attribué à
 * l'émission). L'appelant persiste la facture et passe le devis en « accepté ».
 */
export function factureDepuisDevis(devis: Document): Document {
  const now = Date.now()
  return {
    type: 'facture',
    statut: 'brouillon',
    clientId: devis.clientId,
    lignes: devis.lignes.map((l) => ({ ...l })),
    remiseGlobalePourcent: devis.remiseGlobalePourcent ?? 0,
    dateCreation: now,
    dateEcheance: now + 30 * JOUR,
    devisOrigineId: devis.id,
    verrouille: false,
    updatedAt: now,
  }
}
```

(`JOUR` already exists at the top of the file.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/document.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/document.ts src/lib/document.test.ts
git commit -m "feat: add factureDepuisDevis conversion helper with tests"
```

---

## Task 5: Include `frais` in JSON backup (backward-compatible)

**Files:**
- Modify: `src/db/sauvegarde.ts`

- [ ] **Step 1: Import `Frais` and extend `SauvegardeJSON`**

Add `Frais` to the type import. In `SauvegardeJSON`, add an **optional** field after `documents`:

```ts
  /** Optionnel : absent des sauvegardes antérieures (rétrocompatibilité). */
  frais?: Frais[]
```

(Keep `version: 1` — do not bump.)

- [ ] **Step 2: Export `frais`**

In `exporterDonnees`, add `db.frais.toArray()` to the `Promise.all` destructuring and include it in the returned object:

```ts
  const [parametres, clients, catalogue, documents, frais] = await Promise.all([
    db.parametres.get('company'),
    db.clients.toArray(),
    db.catalogue.toArray(),
    db.documents.toArray(),
    db.frais.toArray(),
  ])
  return {
    version: 1,
    exporteLe: new Date().toISOString(),
    parametres: parametres ?? null,
    clients,
    catalogue,
    documents,
    frais,
  }
```

- [ ] **Step 3: Import `frais` atomically**

In `importerDonnees`, add `db.frais` to the transaction tables and clear/restore it (guarding the optional field):

```ts
  await db.transaction(
    'rw',
    db.parametres,
    db.clients,
    db.catalogue,
    db.documents,
    db.frais,
    async () => {
      await Promise.all([
        db.parametres.clear(),
        db.clients.clear(),
        db.catalogue.clear(),
        db.documents.clear(),
        db.frais.clear(),
      ])
      if (data.parametres) await db.parametres.put(data.parametres)
      if (data.clients.length) await db.clients.bulkPut(data.clients)
      if (data.catalogue.length) await db.catalogue.bulkPut(data.catalogue)
      if (data.documents.length) await db.documents.bulkPut(data.documents)
      if (data.frais?.length) await db.frais.bulkPut(data.frais)
    },
  )
```

- [ ] **Step 4: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/db/sauvegarde.ts
git commit -m "feat: include frais in JSON backup export/import"
```

---

## Task 6: Redesign — base inputs (`champs.tsx`) to indigo + carded sections

**Files:**
- Rewrite: `src/components/champs.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import type { ReactNode } from 'react'

const baseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 h-12 text-base outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'

/** Champ texte sur une ligne, avec libellé au-dessus. */
export function ChampTexte({
  label,
  valeur,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
}: {
  label: string
  valeur: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel'
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        className={baseInput}
        type={type}
        inputMode={inputMode}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** Champ numérique (montant, quantité, taux). Renvoie un nombre. */
export function ChampNombre({
  label,
  valeur,
  onChange,
  step = 'any',
  suffixe,
}: {
  label: string
  valeur: number
  onChange: (v: number) => void
  step?: string
  suffixe?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          className={baseInput}
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isNaN(valeur) ? '' : valeur}
          onChange={(e) =>
            onChange(e.target.value === '' ? 0 : Number(e.target.value))
          }
        />
        {suffixe && <span className="text-gray-500">{suffixe}</span>}
      </div>
    </label>
  )
}

/** Liste déroulante. */
export function ChampSelect<T extends string | number>({
  label,
  valeur,
  options,
  onChange,
}: {
  label: string
  valeur: T
  options: { valeur: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <select
        className={baseInput}
        value={valeur}
        onChange={(e) => {
          const brut = e.target.value
          const choisi = options.find((o) => String(o.valeur) === brut)
          if (choisi) onChange(choisi.valeur)
        }}
      >
        {options.map((o) => (
          <option key={String(o.valeur)} value={String(o.valeur)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Champ texte multiligne. */
export function ChampZone({
  label,
  valeur,
  onChange,
  rows = 3,
}: {
  label: string
  valeur: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <textarea
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
        rows={rows}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** Interrupteur on/off (case à cocher stylée). */
export function Interrupteur({
  label,
  valeur,
  onChange,
}: {
  label: string
  valeur: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="checkbox"
        className="size-6 accent-indigo-600"
        checked={valeur}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

/** Regroupe des champs dans une carte blanche sous un titre de section. */
export function Section({
  titre,
  children,
}: {
  titre: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold tracking-wide text-gray-500 uppercase">
        {titre}
      </h2>
      {children}
    </section>
  )
}
```

- [ ] **Step 2: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/components/champs.tsx
git commit -m "style: indigo inputs and carded sections"
```

---

## Task 7: Redesign — 6-tab icon nav + app background

**Files:**
- Create: `src/components/icones.tsx`
- Rewrite: `src/app/Layout.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create the inline SVG icons**

`src/components/icones.tsx`:

```tsx
/** Icônes de navigation, en SVG inline (zéro dépendance, zéro réseau). */
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconAccueil(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

export function IconDocuments(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M9 12h7M9 16h7" />
    </svg>
  )
}

export function IconFrais(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function IconClients(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9" />
    </svg>
  )
}

export function IconCatalogue(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M4 5h16M4 12h16M4 19h16" />
      <circle cx="4" cy="5" r="0.5" />
    </svg>
  )
}

export function IconReglages(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  )
}
```

- [ ] **Step 2: Rewrite `Layout.tsx` with 6 icon tabs + background**

```tsx
import { NavLink, Outlet } from 'react-router-dom'
import {
  IconAccueil,
  IconCatalogue,
  IconClients,
  IconDocuments,
  IconFrais,
  IconReglages,
} from '../components/icones'

/** Onglets de navigation, affichés en bas (ergonomie pouce sur mobile). */
const onglets = [
  { to: '/', label: 'Accueil', exact: true, Icone: IconAccueil },
  { to: '/documents', label: 'Docs', Icone: IconDocuments },
  { to: '/frais', label: 'Frais', Icone: IconFrais },
  { to: '/clients', label: 'Clients', Icone: IconClients },
  { to: '/catalogue', label: 'Catalogue', Icone: IconCatalogue },
  { to: '/parametres', label: 'Réglages', Icone: IconReglages },
]

/**
 * Coquille de l'application : zone de contenu défilante + barre d'onglets fixe
 * en bas (6 onglets à icônes). Mobile-first, gros boutons.
 */
export default function Layout() {
  return (
    <div className="flex h-full flex-col bg-[#f7f8fc]">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {onglets.map(({ to, label, exact, Icone }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              [
                'flex min-h-16 flex-col items-center justify-center gap-1 text-[10px]',
                isActive ? 'font-semibold text-indigo-600' : 'text-gray-500',
              ].join(' ')
            }
          >
            <Icone />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: Set the body background in `index.css`**

In `src/index.css`, change the `body` rule to add a background (keep existing properties):

```css
body {
  margin: 0;
  background: #f7f8fc;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-text-size-adjust: 100%;
}
```

- [ ] **Step 4: Type-check, run dev sanity, commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/components/icones.tsx src/app/Layout.tsx src/index.css
git commit -m "style: 6-tab icon nav and app background"
```

---

## Task 8: Redesign — swap remaining blue→indigo

**Files (modify):** `src/pages/Documents.tsx`, `src/pages/Clients.tsx`, `src/pages/Catalogue.tsx`, `src/pages/Parametres.tsx`, `src/pages/EditeurDocument.tsx`, `src/components/LignesEditeur.tsx`

These are mechanical class renames (logic untouched). Apply these exact token replacements across the six files above:

| Find | Replace |
|------|---------|
| `bg-blue-700` | `bg-indigo-600` |
| `text-blue-700` | `text-indigo-700` |
| `border-blue-700` | `border-indigo-600` |
| `bg-blue-100` | `bg-indigo-100` |
| `focus:border-blue-600` | `focus:border-indigo-600` |

- [ ] **Step 1: Apply the replacements**

Edit each of the six files, replacing every occurrence per the table. Reference (from `grep blue-`): Documents (2×`bg-blue-700`); Clients (`bg-blue-700`×2, `bg-blue-100 text-blue-700`); Catalogue (`bg-blue-700`×2); Parametres (`bg-blue-700`, `border-blue-700 text-blue-700`); EditeurDocument (`border-blue-700 text-blue-700`, `bg-blue-700`, `focus:border-blue-600`×3, `text-blue-700`); LignesEditeur (`focus:border-blue-600`×2, `border-blue-700 text-blue-700`).

- [ ] **Step 2: Verify no blue class remains**

Run: `grep -rn "blue-" src/`
Expected: no matches.

- [ ] **Step 3: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/pages/Documents.tsx src/pages/Clients.tsx src/pages/Catalogue.tsx src/pages/Parametres.tsx src/pages/EditeurDocument.tsx src/components/LignesEditeur.tsx
git commit -m "style: swap blue accent to indigo across pages"
```

---

## Task 9: Frais feature — helper, routes, list + form pages

**Files:**
- Create: `src/lib/frais.ts`
- Modify: `src/app/router.tsx`
- Create: `src/pages/Frais.tsx`
- Create: `src/pages/EditeurFrais.tsx`

- [ ] **Step 1: Create `src/lib/frais.ts`**

```ts
import type { CategorieFrais, Frais } from '../db/types'

/** Catégories de frais, dans l'ordre d'affichage. */
export const CATEGORIES: { valeur: CategorieFrais; label: string }[] = [
  { valeur: 'carburant', label: 'Carburant' },
  { valeur: 'repas', label: 'Repas' },
  { valeur: 'materiel', label: 'Matériel' },
  { valeur: 'fournitures', label: 'Fournitures' },
  { valeur: 'deplacement', label: 'Déplacement' },
  { valeur: 'autre', label: 'Autre' },
]

export const labelCategorie: Record<CategorieFrais, string> = {
  carburant: 'Carburant',
  repas: 'Repas',
  materiel: 'Matériel',
  fournitures: 'Fournitures',
  deplacement: 'Déplacement',
  autre: 'Autre',
}

/** Frais vierge (date du jour). */
export function fraisVide(): Frais {
  const now = Date.now()
  return {
    date: now,
    libelle: '',
    montantTTC: 0,
    tauxTva: 20,
    tvaRecuperable: true,
    categorie: 'autre',
    createdAt: now,
  }
}
```

- [ ] **Step 2: Add routes in `router.tsx`**

Import the pages and add three child routes (after the `catalogue` route):

```tsx
import Frais from '../pages/Frais'
import EditeurFrais from '../pages/EditeurFrais'
```

```tsx
      { path: 'frais', element: <Frais /> },
      { path: 'frais/nouveau', element: <EditeurFrais /> },
      { path: 'frais/:id', element: <EditeurFrais /> },
```

- [ ] **Step 3: Create `src/pages/Frais.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEntete from '../components/PageEntete'
import { db } from '../db/db'
import { labelCategorie } from '../lib/frais'
import { formatDate, formatEuro } from '../lib/format'

/** Somme des frais du mois courant. */
function totalDuMois(frais: { date: number; montantTTC: number }[]): number {
  const d = new Date()
  const debut = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  return frais
    .filter((f) => f.date >= debut)
    .reduce((s, f) => s + f.montantTTC, 0)
}

export default function Frais() {
  const navigate = useNavigate()
  const frais = useLiveQuery(
    () => db.frais.orderBy('date').reverse().toArray(),
    [],
  )

  return (
    <div>
      <PageEntete
        titre="Frais"
        actions={
          <button
            type="button"
            onClick={() => navigate('/frais/nouveau')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            + Frais
          </button>
        }
      />

      {frais && frais.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Frais du mois
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatEuro(totalDuMois(frais))}
          </p>
        </div>
      )}

      {frais?.length === 0 && (
        <p className="p-4 text-gray-600">
          Aucun frais. Ajoutez-en un avec « + Frais ».
        </p>
      )}

      <ul className="mt-2 divide-y divide-gray-100">
        {frais?.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => navigate(`/frais/${f.id}`)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              {f.photo ? (
                <img
                  src={f.photo}
                  alt=""
                  className="size-12 shrink-0 rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400">
                  Reçu
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                  {f.libelle || labelCategorie[f.categorie]}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {labelCategorie[f.categorie]} · {formatDate(f.date)}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-gray-900">
                {formatEuro(f.montantTTC)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/pages/EditeurFrais.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChampNombre, ChampSelect, ChampTexte, Interrupteur, Section } from '../components/champs'
import { db } from '../db/db'
import { montantTvaDeductible } from '../db/calculs'
import type { CategorieFrais, Frais } from '../db/types'
import { CATEGORIES, fraisVide } from '../lib/frais'
import { fichierVersDataUrl } from '../lib/image'
import { formatEuro, versInputDate, depuisInputDate } from '../lib/format'

const TAUX_TVA = [
  { valeur: 20, label: '20 %' },
  { valeur: 10, label: '10 %' },
  { valeur: 5.5, label: '5,5 %' },
  { valeur: 0, label: '0 %' },
]

export default function EditeurFrais() {
  const { id } = useParams()
  const navigate = useNavigate()
  const photoRef = useRef<HTMLInputElement>(null)
  const [frais, setFrais] = useState<Frais | null>(null)

  useEffect(() => {
    if (id === 'nouveau' || id == null) {
      setFrais(fraisVide())
    } else {
      db.frais.get(Number(id)).then((f) => setFrais(f ?? null))
    }
  }, [id])

  if (!frais) {
    return <p className="p-4 text-gray-600">Chargement…</p>
  }

  function set<K extends keyof Frais>(cle: K, valeur: Frais[K]) {
    setFrais((f) => (f ? { ...f, [cle]: valeur } : f))
  }

  async function choisirPhoto(fichier: File) {
    try {
      set('photo', await fichierVersDataUrl(fichier, 800))
    } catch {
      window.alert('Image illisible.')
    }
  }

  async function enregistrer() {
    if (!frais) return
    if (frais.id == null) {
      await db.frais.add(frais)
    } else {
      await db.frais.put(frais)
    }
    navigate('/frais')
  }

  async function supprimer() {
    if (frais?.id == null) return
    if (!window.confirm('Supprimer ce frais ?')) return
    await db.frais.delete(frais.id)
    navigate('/frais')
  }

  const tvaDeductible = montantTvaDeductible(
    frais.montantTTC,
    frais.tauxTva,
    frais.tvaRecuperable,
  )

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={() => navigate('/frais')}
          className="px-1 text-2xl leading-none text-gray-500"
          aria-label="Retour"
        >
          ‹
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-gray-900">
          {frais.id == null ? 'Nouveau frais' : 'Modifier le frais'}
        </h1>
        <button
          type="button"
          onClick={enregistrer}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Enregistrer
        </button>
      </header>

      <div className="space-y-6 p-4">
        <Section titre="Reçu">
          <div className="flex items-center gap-4">
            {frais.photo ? (
              <img
                src={frais.photo}
                alt="Reçu"
                className="size-24 rounded-lg border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                Aucune photo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
              >
                {frais.photo ? 'Reprendre' : 'Photographier le reçu'}
              </button>
              {frais.photo && (
                <button
                  type="button"
                  onClick={() => set('photo', undefined)}
                  className="text-sm font-semibold text-red-600"
                >
                  Retirer
                </button>
              )}
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) choisirPhoto(f)
                e.target.value = ''
              }}
            />
          </div>
        </Section>

        <Section titre="Détails">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </span>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 h-12 text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              value={versInputDate(frais.date)}
              onChange={(e) =>
                set('date', depuisInputDate(e.target.value) ?? frais.date)
              }
            />
          </label>
          <ChampTexte
            label="Libellé"
            valeur={frais.libelle}
            onChange={(v) => set('libelle', v)}
            placeholder="Ex : Plein gazole"
          />
          <ChampSelect<CategorieFrais>
            label="Catégorie"
            valeur={frais.categorie}
            onChange={(v) => set('categorie', v)}
            options={CATEGORIES}
          />
          <ChampNombre
            label="Montant TTC"
            valeur={frais.montantTTC}
            onChange={(v) => set('montantTTC', v)}
            step="0.01"
            suffixe="€"
          />
          <ChampSelect<number>
            label="Taux de TVA"
            valeur={frais.tauxTva}
            onChange={(v) => set('tauxTva', v)}
            options={TAUX_TVA}
          />
          <Interrupteur
            label="TVA récupérable"
            valeur={frais.tvaRecuperable}
            onChange={(v) => set('tvaRecuperable', v)}
          />
          <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-600">TVA déductible</span>
            <span className="font-semibold">{formatEuro(tvaDeductible)}</span>
          </div>
        </Section>

        {frais.id != null && (
          <button
            type="button"
            onClick={supprimer}
            className="w-full rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600"
          >
            Supprimer ce frais
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/lib/frais.ts src/app/router.tsx src/pages/Frais.tsx src/pages/EditeurFrais.tsx
git commit -m "feat: add frais journal with receipt photo capture"
```

---

## Task 10: Accueil — "Frais du mois" card

**Files:**
- Rewrite: `src/pages/Accueil.tsx`

- [ ] **Step 1: Replace `Accueil.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks'
import PageEntete from '../components/PageEntete'
import { db } from '../db/db'
import { formatEuro } from '../lib/format'

/** Début du mois courant (timestamp ms). */
function debutDuMois(): number {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export default function Accueil() {
  const fraisDuMois = useLiveQuery(async () => {
    const liste = await db.frais.where('date').aboveOrEqual(debutDuMois()).toArray()
    return liste.reduce((s, f) => s + f.montantTTC, 0)
  }, [])

  return (
    <div>
      <PageEntete titre="Accueil" />
      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Frais du mois
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatEuro(fraisDuMois ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/pages/Accueil.tsx
git commit -m "feat: show frais du mois on home dashboard"
```

---

## Task 11: Devis → facture conversion button

**Files:**
- Modify: `src/pages/EditeurDocument.tsx`

- [ ] **Step 1: Import the helper**

Add `factureDepuisDevis` to the existing import from `../lib/document`:

```tsx
import { documentVide, factureDepuisDevis, labelStatut, labelType } from '../lib/document'
```

- [ ] **Step 2: Add the conversion handler**

Inside the component, after `genererPdf`:

```tsx
  async function convertirEnFacture() {
    if (!doc || doc.id == null) return
    if (!window.confirm('Convertir ce devis en facture ? Le devis sera marqué « accepté ».')) {
      return
    }
    const devisId = doc.id
    const facture = factureDepuisDevis(doc)
    const nouvelId = await db.transaction('rw', db.documents, async () => {
      const id = await db.documents.add(facture)
      await db.documents.update(devisId, { statut: 'accepte', updatedAt: Date.now() })
      return id
    })
    navigate(`/documents/${nouvelId}`)
  }
```

- [ ] **Step 3: Add the button in the header**

In the header `<button>` group, after the PDF button and before the Enregistrer button, add (visible only for a saved devis):

```tsx
        {doc.type === 'devis' && doc.id != null && (
          <button
            type="button"
            onClick={convertirEnFacture}
            className="rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700"
          >
            → Facture
          </button>
        )}
```

- [ ] **Step 4: Type-check and commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add src/pages/EditeurDocument.tsx
git commit -m "feat: convert a saved devis into a facture draft"
```

---

## Task 12: Assurance RC — settings section + PDF footer

**Files:**
- Modify: `src/pages/Parametres.tsx`
- Modify: `src/pdf/DocumentPDF.tsx`

- [ ] **Step 1: Add the settings section**

In `Parametres.tsx`, after the `Section titre="Mentions légales"` block (closes around line 195), add:

```tsx
        <Section titre="Assurance RC">
          <p className="text-xs text-gray-500">
            Mention obligatoire pour certaines professions réglementées. Affichée
            en bas des PDF si renseignée.
          </p>
          <ChampTexte
            label="Assureur"
            valeur={form.assuranceRC ?? ''}
            onChange={(v) => set('assuranceRC', v)}
          />
          <ChampTexte
            label="N° de contrat"
            valeur={form.assuranceContrat ?? ''}
            onChange={(v) => set('assuranceContrat', v)}
          />
          <ChampTexte
            label="Couverture géographique"
            valeur={form.assuranceCouverture ?? ''}
            onChange={(v) => set('assuranceCouverture', v)}
          />
        </Section>
```

- [ ] **Step 2: Carry insurance fields through `resoudreEmetteur` in `DocumentPDF.tsx`**

In the fallback object of `resoudreEmetteur` (after `iban: params.iban,`):

```tsx
      assuranceRC: params.assuranceRC,
      assuranceContrat: params.assuranceContrat,
      assuranceCouverture: params.assuranceCouverture,
```

- [ ] **Step 3: Render the insurance line in the PDF footer**

In the `styles.pied` `<View>`, after the IBAN line and before the notes line, add:

```tsx
          {e.assuranceRC ? (
            <Text style={styles.piedLigne}>
              Assurance RC Pro : {e.assuranceRC}
              {e.assuranceContrat ? ` — contrat ${e.assuranceContrat}` : ''}
              {e.assuranceCouverture ? ` — ${e.assuranceCouverture}` : ''}
            </Text>
          ) : null}
```

- [ ] **Step 4: Type-check, build, commit**

Run: `npx tsc -b && npm run build`
Expected: build succeeds.

```bash
git add src/pages/Parametres.tsx src/pdf/DocumentPDF.tsx
git commit -m "feat: add RC Pro insurance setting and PDF mention"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `npm test`
Expected: all tests pass (calculs + document).

- [ ] **Production build**

Run: `npm run build`
Expected: succeeds, no TS errors.

- [ ] **Manual smoke (offline)** — `npm run dev`, then verify:
  - Bottom nav shows 6 icon tabs; active tab indigo.
  - Frais: add a frais, photograph a receipt (mobile opens camera), TVA déductible updates, item appears in list, "Frais du mois" updates on Accueil.
  - Devis → "→ Facture" creates a facture draft; original devis now "Accepté".
  - Réglages → Assurance RC filled → generate a facture PDF → insurance line shows in footer.
  - Réglages → export JSON, reimport → frais preserved.
  - DevTools → offline mode → app still loads and works (service worker).

---

## Self-review notes

- **Spec coverage:** Frais (T2,3,5,9,10) ✓ · conversion (T4,11) ✓ · assurance RC (T2,12) ✓ · redesign A indigo + 6-tab icon nav (T6,7,8) ✓ · no new runtime dep / offline (constraints + T1 dev-only) ✓ · Dexie v2 (T2) ✓ · backup includes frais (T5) ✓.
- **Out of scope (untouched):** legal numbering/emission, Factur-X, avoirs, email.
- **Type consistency:** `montantTvaDeductible(montantTTC, tauxTva, recuperable)` and `factureDepuisDevis(devis)` used identically across tasks. `Frais` fields match between types, frais.ts, pages, and backup.
