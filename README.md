# Projet : App de devis / factures pour indépendant — 100% locale

## Contexte
Application destinée à UN indépendant (non technique). Il doit pouvoir créer des devis et factures depuis son téléphone ou son PC, à partir de modèles pré-remplis, générer un PDF propre, et l'envoyer par email. Aucune donnée ne doit partir sur un serveur : tout est local et hors-ligne.

## Choix technique : PWA locale (offline-first)
- **Frontend** : React + Vite + TypeScript
- **UI** : Tailwind CSS (interface mobile-first, gros boutons, simple)
- **PWA** : vite-plugin-pwa (service worker, installable sur Android/iOS/PC, fonctionne sans connexion)
- **Stockage local** : IndexedDB via la librairie Dexie.js (clients, devis, factures, paramètres)
- **Génération PDF** : pdf-lib ou @react-pdf/renderer (génération 100% côté client, pas de serveur)
- **Envoi email** : Web Share API (navigator.share avec le fichier PDF) → ouvre l'appli mail du téléphone avec le PDF en pièce jointe. Fallback : téléchargement du PDF + lien mailto pré-rempli (objet + corps).
- **Sauvegarde / portabilité** : export et import de toutes les données en un fichier JSON (pour changer d'appareil ou faire un backup).

## Fonctionnalités (MVP)

### 1. Paramètres de l'entreprise (première utilisation)
- Nom, adresse, SIRET, téléphone, email, logo (upload image stockée en local)
- Mentions légales : TVA applicable ou non ("TVA non applicable, art. 293 B du CGI" pour auto-entrepreneur), conditions de paiement, pénalités de retard, IBAN
- Choix du préfixe et de la numérotation auto des documents (ex : DEV-2026-001, FAC-2026-001)

### 2. Gestion des clients
- Liste de clients : nom/raison sociale, adresse, email, téléphone, SIRET optionnel
- Création rapide d'un client depuis le formulaire de devis

### 3. Catalogue de prestations
- Lignes réutilisables : libellé, prix unitaire HT, unité (heure, jour, forfait, pièce), taux de TVA
- Sélection rapide dans le devis pour ne pas tout retaper

### 4. Création de devis
- Choix du client + ajout de lignes (depuis le catalogue ou libres)
- Calcul automatique : total HT, TVA par taux, total TTC, remise éventuelle
- Date de validité du devis
- Statuts : brouillon → envoyé → accepté / refusé
- Conversion d'un devis accepté en facture en 1 clic (reprend toutes les lignes)

### 5. Création de factures
- Mêmes mécanismes que le devis + date d'échéance, acompte éventuel
- Statuts : brouillon → envoyée → payée / en retard
- Numérotation séquentielle stricte sans trou (obligation légale française)
- Une facture émise n'est plus modifiable (seulement duplicable ou avoir)

### 6. Modèles de documents PDF
- 2 ou 3 modèles visuels au choix (classique, moderne, minimal) avec couleur d'accent personnalisable
- Le PDF contient obligatoirement : infos émetteur, infos client, numéro, dates, lignes, totaux HT/TVA/TTC, mentions légales
- Aperçu avant génération

### 7. Envoi par email
- Bouton "Envoyer" → génère le PDF → navigator.share (mobile) ou mailto + téléchargement (desktop)
- Objet et corps du mail pré-remplis (modifiables dans les paramètres) : "Devis n°DEV-2026-001 — [Nom entreprise]"

### 8. Tableau de bord
- Liste des documents avec recherche et filtres par statut
- Petits totaux : CA facturé du mois / de l'année, factures en attente de paiement

### 9. Conformité facturation électronique (réforme 2026-2027)
Contexte légal : en France, les factures B2B doivent être au format électronique structuré et transiter par une plateforme agréée (PA, ex-PDP). Réception obligatoire pour tous dès septembre 2026, émission obligatoire pour les micro-entreprises en septembre 2027. L'app ne transmet pas elle-même les factures à l'administration (impossible en local), mais elle produit des fichiers conformes prêts à être importés dans n'importe quelle plateforme agréée.

- **Génération Factur-X** : la facture est exportée en PDF/A-3 avec le fichier XML CII embarqué (profil BASIC de la norme EN 16931). Utiliser pdf-lib pour l'embarquement de la pièce jointe XML + métadonnées XMP PDF/A-3. C'est l'étape technique la plus délicate du projet : la traiter isolément, avec validation du XML généré.
- **Export XML seul** : en complément, bouton pour exporter le XML CII brut (utile pour certains imports).
- **Mentions obligatoires renforcées** : SIREN/SIRET du client professionnel (obligatoire en B2B), adresse de livraison si différente de l'adresse de facturation, catégorie de l'opération (livraison de biens / prestation de services / mixte), option de paiement de la TVA sur les débits le cas échéant.
- **Distinction client pro / particulier** : champ type de client. B2B = Factur-X requis ; B2C = PDF simple autorisé (e-reporting géré en dehors de l'app, via la plateforme agréée ou le comptable).
- **Archivage** : conservation de tous les documents émis (PDF + XML) dans le stockage local, avec export ZIP de l'ensemble pour transmission au comptable ou import dans une plateforme agréée.
- **Verrouillage strict** : facture émise = immuable, modification uniquement par avoir (facture d'avoir avec numérotation propre).

## Contraintes
- Mobile-first : tout doit être utilisable au pouce sur un écran de téléphone
- Zéro dépendance réseau au runtime (sauf l'ouverture du client mail)
- Données jamais envoyées à un serveur
- Interface en français
- Code simple et commenté, un seul projet, facile à maintenir

## Étapes de développement suggérées
1. Setup projet Vite + React + TS + Tailwind + PWA + Dexie
2. Modèle de données (settings, clients, items, documents) + export/import JSON
3. Écran paramètres entreprise + onboarding première utilisation
4. CRUD clients et catalogue de prestations
5. Formulaire devis/facture avec calculs automatiques
6. Génération PDF (1 modèle d'abord, les autres ensuite)
7. Envoi email (Web Share API + fallback mailto)
8. Tableau de bord + statuts + conversion devis→facture
9. Génération Factur-X (XML CII + embarquement PDF/A-3) et mentions B2B — étape isolée, avec validation
10. Polish : numérotation légale, verrouillage des factures émises, avoirs, export ZIP comptable, tests sur mobile

## Alternative si finalement desktop uniquement
Si l'usage téléphone est abandonné : Tauri (Rust + même frontend React) avec SQLite pour le stockage et envoi SMTP automatique via les identifiants mail de l'utilisateur (nodemailer côté sidecar ou plugin Tauri). Plus lourd à mettre en place, à ne faire que si nécessaire.
