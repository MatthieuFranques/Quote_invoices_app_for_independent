# FactureLocale

**Application de devis et factures pour indépendant français — 100 % locale, hors-ligne, sans serveur.**

FactureLocale permet à un travailleur indépendant (auto-entrepreneur, freelance,
profession libérale) de créer des devis et des factures depuis son téléphone ou
son ordinateur, de générer un PDF propre, et de garder l'intégralité de ses
données **sur son appareil**. Aucune information ne part sur Internet.

> ⚠️ **Avertissement** : cet outil aide à produire des documents, mais ne
> garantit pas leur conformité fiscale ou légale. La responsabilité du contenu
> et du respect de la réglementation incombe à l'utilisateur. Voir
> [Avertissement & responsabilité](#avertissement--responsabilité).

---

## Sommaire

- [Pourquoi cette app](#pourquoi-cette-app)
- [Fonctionnalités](#fonctionnalités)
- [Confidentialité & fonctionnement hors-ligne](#confidentialité--fonctionnement-hors-ligne)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Télécharger l'application (.exe / .apk / .dmg)](#télécharger-lapplication-exe--apk--dmg)
- [Structure du projet](#structure-du-projet)
- [Sauvegarde des données](#sauvegarde-des-données)
- [Conformité facturation française](#conformité-facturation-française)
- [Contribuer](#contribuer)
- [Licence](#licence)
- [Avertissement & responsabilité](#avertissement--responsabilité)

---

## Pourquoi cette app

La plupart des logiciels de facturation sont des services en ligne : abonnement,
compte, données hébergées chez un tiers. FactureLocale prend le parti inverse —
**tout reste chez vous** :

- pas de compte, pas d'abonnement, pas de cloud ;
- fonctionne sans connexion Internet, même en avion ;
- installable comme une application (Android, PC, iOS) grâce à la technologie PWA ;
- vos clients, devis et factures sont stockés uniquement dans le navigateur de
  votre appareil.

## Fonctionnalités

- **Paramètres entreprise** : identité, SIRET, logo, mentions légales, IBAN,
  préfixes de numérotation, couleur d'accent des PDF.
- **Clients** : fiches B2B (professionnel) ou B2C (particulier), avec SIRET pour
  les pros.
- **Catalogue de prestations** : lignes réutilisables (libellé, prix HT, unité,
  taux de TVA) pour facturer plus vite.
- **Devis & factures** : éditeur avec calcul automatique du HT, de la TVA par
  taux, du TTC, des remises (par ligne et globale) et de l'acompte.
- **Conversion devis → facture** en un clic (reprend client, lignes et remises).
- **Génération PDF** côté client, sans serveur.
- **Tableau de bord** : chiffre d'affaires du mois / de l'année, factures en
  attente, recherche et filtres sur les documents.
- **Import / export JSON** : sauvegarde complète ou export des seuls documents,
  pour changer d'appareil ou archiver.

Un aperçu des écrans cibles se trouve dans le dossier [`maquette/`](maquette/).

## Confidentialité & fonctionnement hors-ligne

C'est le cœur du projet :

- **Aucun appel réseau au runtime.** L'application ne contacte aucun serveur, ni
  CDN, ni police distante. Tout le code des dépendances est intégré au build.
- **Stockage local uniquement** via IndexedDB (base de données du navigateur).
- **Service worker** (PWA) : après le premier chargement, l'app est mise en cache
  et fonctionne entièrement hors-ligne.
- Les seules « sorties » possibles sont des actions **explicites de
  l'utilisateur** : télécharger un PDF ou exporter un fichier JSON, qui restent
  sur l'appareil.

> L'envoi par e-mail n'est pas activé dans cette version : on génère le PDF et on
> l'enregistre en local. L'utilisateur l'envoie ensuite par ses propres moyens.

## Stack technique

| Domaine | Choix |
|---|---|
| Framework UI | React 19 + TypeScript |
| Build | Vite 6 |
| Style | Tailwind CSS 4 (design system Material 3, voir `maquette/facturelocale/DESIGN.md`) |
| PWA / offline | `vite-plugin-pwa` (Workbox) |
| Base locale | IndexedDB via Dexie.js |
| PDF | `@react-pdf/renderer` (polices intégrées, aucun téléchargement) |
| Routage | React Router |

## Démarrage rapide

Prérequis : **Node.js 20+** et npm.

```bash
# 1. Installer les dépendances (une seule fois, nécessite Internet)
npm install

# 2. Lancer en développement
npm run dev

# 3. Construire la version de production (génère le dossier dist/)
npm run build

# 4. Prévisualiser le build de production en local
npm run preview
```

Une fois `npm run build` exécuté, **tout est dans `dist/`** : ce dossier statique
est autosuffisant et ne nécessite plus aucune connexion pour fonctionner.

➡️ Guide détaillé (déploiement, Docker, installation sur téléphone) :
[`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## Télécharger l'application (.exe / .apk / .dmg)

L'app web est empaquetée en applications natives, **toutes 100 % hors-ligne**
(le code et les données sont embarqués, rien ne part sur Internet) :

| Plateforme        | Fichier            | Outil       |
| ----------------- | ------------------ | ----------- |
| Windows           | `.exe` (installeur)| Tauri       |
| macOS             | `.dmg`             | Tauri       |
| Android           | `.apk`             | Capacitor   |
| iPhone / iPad     | PWA (voir ci-dessous) | navigateur |

### Pour l'utilisateur final

Va dans l'onglet **[Releases](../../releases)** du dépôt GitHub et télécharge le
fichier correspondant à ton appareil :

- **Windows** : `Devis-Factures_x.y.z_x64-setup.exe` → double-clic → installer.
- **macOS** : `.dmg` → glisser dans Applications. (App non signée : au 1er lancement,
  clic droit → « Ouvrir ».)
- **Android** : `Devis-Factures-vX.Y.Z.apk` → ouvrir le fichier sur le téléphone.
  Autoriser « installer depuis cette source » si demandé (APK debug non signé Play Store).
- **iPhone / iPad** : pas de fichier à installer. Ouvre la PWA dans **Safari**,
  bouton Partager → **« Sur l'écran d'accueil »**. Fonctionne hors-ligne ensuite.

### Pour publier une release (mainteneur)

Tout est construit automatiquement par GitHub Actions
([`.github/workflows/release.yml`](.github/workflows/release.yml)) :

```bash
# Choisir une version, poser un tag, le pousser
git tag v0.1.0
git push origin v0.1.0
```

Le push du tag déclenche le build de `.exe` + `.dmg` (runners Windows/macOS) et de
`.apk` (runner Linux + Android SDK), puis attache les fichiers à la Release GitHub.
**Aucun outil lourd à installer en local** (ni Rust, ni Android SDK).

### Builds en local (optionnel)

```bash
# Desktop (.exe / .dmg) — nécessite Rust : https://rustup.rs
npm run desktop:build      # bundle dans src-tauri/target/release/bundle/

# Android (.apk) — nécessite Java 17 + Android SDK
npm run android:apk        # apk dans android/app/build/outputs/apk/debug/
```

## Structure du projet

```
src/
  app/         Coquille de l'application (Layout, router)
  components/  Composants réutilisables (champs, feuille modale, icônes…)
  db/          Modèle de données, base Dexie, calculs, sauvegarde JSON
  lib/         Utilitaires (formatage, logique document, images)
  pages/       Écrans (Accueil, Clients, Catalogue, Éditeur, Paramètres)
  pdf/         Génération des PDF (modèle + helpers)
maquette/      Maquettes HTML/PNG de référence + design system
docs/          Documentation (installation, specs, plan)
```

## Sauvegarde des données

Les données vivent dans le navigateur de l'appareil. Pour les protéger ou
migrer :

- **Paramètres → Sauvegarde** : exporte / importe **toutes** les données
  (paramètres, clients, catalogue, documents) en un fichier JSON.
  ⚠️ L'import **remplace** tout le contenu existant.
- **Paramètres → Documents (JSON)** : exporte / importe **seulement les
  documents**. L'import **ajoute** sans effacer l'existant.

Pensez à exporter régulièrement : vider les données du navigateur efface la base.

## Conformité facturation française

L'application vise à respecter les règles de facturation françaises :

- **Numérotation séquentielle stricte sans trou** (séquences distinctes pour
  devis et factures).
- **Facture émise = immuable** : modification uniquement via un avoir.
- **TVA** : gestion de la franchise (auto-entrepreneur, « TVA non applicable,
  art. 293 B du CGI ») et calcul par taux.
- **B2B vs B2C** : le SIRET client est requis pour les professionnels.

La conformité **Factur-X** (PDF/A-3 + XML CII, réforme 2026-2027) est un jalon
identifié, traité séparément. Voir `docs/` pour les specs. L'application **ne
transmet pas** les factures à l'administration : elle produit des fichiers
destinés à être importés dans une plateforme agréée (PA/PDP) ou transmis au
comptable.

## Contribuer

Les contributions sont les bienvenues. Lisez [`CONTRIBUTING.md`](CONTRIBUTING.md)
et le [code de conduite](CODE_OF_CONDUCT.md) avant d'ouvrir une issue ou une pull
request. Pour signaler une faille, voir [`SECURITY.md`](SECURITY.md).

## Licence

Distribué sous licence **MIT**. Voir [`LICENSE`](LICENSE).

## Avertissement & responsabilité

FactureLocale est un outil d'aide à la rédaction de devis et factures, fourni
**« en l'état », sans aucune garantie** (cf. clause de la licence MIT).

- L'outil **ne constitue pas un conseil juridique, fiscal ou comptable**.
- Il **ne garantit pas** que les documents produits sont conformes à la
  réglementation en vigueur (mentions obligatoires, TVA, numérotation,
  Factur-X, etc.), celle-ci pouvant évoluer.
- **L'utilisateur reste seul responsable** de l'exactitude des informations
  saisies, de la conformité légale de ses documents, de la conservation et de la
  sauvegarde de ses données.
- Les auteurs et contributeurs **ne sauraient être tenus responsables** de toute
  perte de données, sanction, ou préjudice résultant de l'usage de l'outil.

En cas de doute, consultez un expert-comptable ou l'administration fiscale.
