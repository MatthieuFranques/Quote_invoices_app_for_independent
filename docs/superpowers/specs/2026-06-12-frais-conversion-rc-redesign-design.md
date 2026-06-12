# Design — Frais, conversion devis→facture, assurance RC, redesign

Date : 2026-06-12
Statut : validé (en attente de revue de la spec écrite)

## Contexte

App de devis/factures pour un indépendant français non technique. PWA React +
Vite + TypeScript + Tailwind, stockage local IndexedDB via Dexie, PDF côté client
via `@react-pdf/renderer`. Contrainte non négociable : **100% local, hors-ligne,
zéro donnée ne quitte l'appareil, zéro appel réseau au runtime, aucune nouvelle
dépendance externe.**

Quatre chantiers indépendants demandés par l'utilisateur :

1. Frais entreprise avec photo du reçu (nouvelle fonctionnalité, hors spec initiale).
2. Conversion d'un devis en facture.
3. Mention assurance responsabilité civile (RC Pro).
4. Refonte visuelle de l'interface (style « Indigo moderne »), surtout la saisie.

## Contraintes transverses

- **Aucune nouvelle dépendance npm.** Tout réutilise l'existant : React, Dexie,
  `dexie-react-hooks`, Tailwind, `@react-pdf/renderer`, `react-router-dom`,
  `lib/image.ts`.
- **Offline-only.** Aucun fetch réseau. La capture photo passe par l'API
  fichier/caméra du navigateur (`<input type="file" capture>`) ; rien n'est
  uploadé. Tout est bundlé par Vite et servi par le service worker PWA.
- **Migration Dexie v2.** Le schéma IndexedDB passe en `version(2)` pour ajouter
  la table `frais` et les champs assurance. C'est un numéro de schéma **interne**
  (mécanisme Dexie), local, invisible pour l'utilisateur, sans perte des données
  existantes. Aucun rapport avec une « version 2 » de l'app ni avec l'email.
- **Hors périmètre** (non touché) : numérotation/émission légale, Factur-X,
  avoirs, envoi email.

---

## Chantier 1 — Frais entreprise

### Modèle de données

Nouveau type dans `src/db/types.ts` :

```ts
export type CategorieFrais =
  | 'carburant' | 'repas' | 'materiel'
  | 'fournitures' | 'deplacement' | 'autre'

export interface Frais {
  id?: number
  date: number            // timestamp ms
  libelle: string
  montantTTC: number
  tauxTva: number         // 20, 10, 5.5, 0
  tvaRecuperable: boolean // si false, TVA déductible affichée = 0
  categorie: CategorieFrais
  photo?: string          // data URL du reçu, compressée via lib/image.ts
  createdAt: number
}
```

### Base de données

`src/db/db.ts` :
- Ajout `frais!: Table<Frais, number>`.
- `this.version(2).stores({ ... , frais: '++id, date, categorie' })`. La
  déclaration `version(1)` existante est conservée telle quelle (Dexie applique
  les migrations en chaîne).

### Calcul TVA déductible

`montantHT = montantTTC / (1 + tauxTva/100)` ; `tvaDeductible = tvaRecuperable
? montantTTC - montantHT : 0`. Helper dans `src/db/calculs.ts` (à côté de
`calculerTotaux`).

### UI

- `src/pages/Frais.tsx` : liste triée par date décroissante (`useLiveQuery`).
  Chaque ligne : vignette photo (ou placeholder), libellé, badge catégorie,
  date, montant TTC. Bouton `+ Frais` dans l'en-tête. Petit total du mois en
  tête de liste.
- `src/pages/EditeurFrais.tsx` : formulaire — date, libellé, montant TTC, taux
  TVA (select), interrupteur « TVA récupérable », catégorie (select), photo.
  Capture : `<input type="file" accept="image/*" capture="environment">`
  (ouvre l'appareil photo sur mobile, sélecteur de fichier sur desktop).
  Compression/redimensionnement via `fichierVersDataUrl` de `lib/image.ts`.
  Affiche la TVA déductible calculée en direct. Boutons Enregistrer / Supprimer.
- Routes ajoutées dans `src/app/router.tsx` : `/frais`, `/frais/nouveau`,
  `/frais/:id`.

### Sauvegarde JSON

`src/db/sauvegarde.ts` : inclure la table `frais` dans l'export et l'import
(même mécanisme que clients/documents). L'import vide et réécrit `frais`.

### Accueil

`src/pages/Accueil.tsx` : carte « Frais du mois » (somme `montantTTC` du mois
courant) à côté des indicateurs existants.

---

## Chantier 2 — Conversion devis → facture

### Logique

`src/lib/document.ts` :

```ts
// Crée (sans persister) une facture brouillon à partir d'un devis.
export function factureDepuisDevis(devis: Document): Document
```

Copie `clientId`, `lignes` (copie profonde), `remiseGlobalePourcent`. Met
`type: 'facture'`, `statut: 'brouillon'`, `dateEcheance = now + 30j`,
`devisOrigineId = devis.id`, `verrouille: false`, nouveaux `dateCreation` /
`updatedAt`. Pas de `numero` (attribué seulement à l'émission, hors périmètre).

### UI

`src/pages/EditeurDocument.tsx` :
- Bouton **« Convertir en facture »** visible si `doc.type === 'devis'` &&
  `doc.id != null` (devis déjà enregistré).
- Au clic, dans **une transaction Dexie** (`db.transaction('rw', db.documents,
  …)`) : `add` de la nouvelle facture + `update` du devis en `statut: 'accepte'`.
  Récupère l'`id` de la facture créée, puis `navigate('/documents/'+id)`.
- Confirmation `window.confirm` avant conversion.

---

## Chantier 3 — Assurance responsabilité civile

### Modèle

`src/db/types.ts` — ajout à `ParametresEntreprise` :

```ts
assuranceRC?: string          // nom de l'assureur
assuranceContrat?: string     // n° de contrat
assuranceCouverture?: string  // couverture géographique
```

Mêmes trois champs ajoutés à `SnapshotEmetteur` (figés à l'émission pour
l'immuabilité).

`src/db/db.ts` : `parametresParDefaut()` initialise les trois champs à `''`.
Champs optionnels → pas de migration de données nécessaire (les enregistrements
existants renvoient `undefined`, traité comme vide).

### UI Réglages

`src/pages/Parametres.tsx` : nouvelle `Section titre="Assurance RC"` avec trois
`ChampTexte` (assureur, n° contrat, couverture géographique). Texte d'aide :
mention obligatoire pour certaines professions réglementées.

### PDF

`src/pdf/DocumentPDF.tsx` : si `assuranceRC` renseigné (via le snapshot émetteur,
sinon paramètres), afficher en bas dans les mentions légales :
« Assurance RC Pro : {assureur} — contrat {n°} — {couverture} ». Champs vides omis.

---

## Chantier 4 — Redesign « Indigo moderne »

Aucun changement de logique : présentation uniquement.

### Thème

- Accent UI : indigo `#4f46e5` (remplace `blue-700`/`blue-600` dans les classes
  Tailwind des composants et pages).
- Fond application : `#f7f8fc` (gris-indigo très clair).
- Conteneurs : cartes blanches `rounded-xl shadow-sm` regroupant les champs.
- L'accent **PDF** (`couleurAccent` dans les paramètres) reste indépendant et
  configurable par l'utilisateur — non modifié.

### Composants

- `src/components/champs.tsx` : inputs agrandis (`h-12`, `text-base`), focus ring
  indigo (`focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`), labels
  nets. `Section` rendue en carte blanche. Tous les écrans héritent du gain de
  saisie sans modification individuelle.
- `src/components/PageEntete.tsx` : en-tête harmonisé (titre + zone d'actions
  cohérente, fond clair).
- `src/app/Layout.tsx` : barre de nav à **6 onglets avec icônes** — Accueil,
  Documents, Frais, Clients, Catalogue, Réglages. Icônes en **SVG inline**
  (composants locaux, zéro dépendance, zéro réseau). Libellés courts sous
  l'icône. Onglet actif en indigo.

### Pages reskinnées

`Documents.tsx`, `Clients.tsx`, `Catalogue.tsx`, `Parametres.tsx`,
`EditeurDocument.tsx`, `Frais.tsx`, `EditeurFrais.tsx`, `Accueil.tsx` : sections
en cartes, boutons indigo, espacements cohérents. Logique, calculs et flux de
données inchangés.

---

## Découpage / isolation

Chaque chantier est indépendant et testable seul :
- **Frais** : type + table + 2 pages + route + sauvegarde. N'impacte aucun
  document existant.
- **Conversion** : 1 fonction pure (`factureDepuisDevis`) + 1 bouton + 1
  transaction. Testable en isolant la fonction pure.
- **Assurance RC** : champs optionnels + 1 section Réglages + bloc PDF. Sans
  effet si non renseigné.
- **Redesign** : purement présentationnel ; aucune logique modifiée.

Ordre de mise en œuvre suggéré : redesign des composants de base (`champs`,
`PageEntete`, `Layout`) d'abord → puis les 3 fonctionnalités héritent du nouveau
style à mesure qu'on crée/touche leurs écrans.

## Tests / vérification

- `factureDepuisDevis` : test unitaire (copie des lignes, type/statut, dates,
  lien d'origine).
- Helper TVA déductible : test unitaire (récupérable vs non).
- Migration Dexie v2 : vérifier qu'une base v1 existante s'ouvre sans perte et
  que la table `frais` est disponible.
- Manuel : capture photo sur mobile, conversion devis→facture, mention RC sur le
  PDF, rendu offline (service worker, mode avion).
