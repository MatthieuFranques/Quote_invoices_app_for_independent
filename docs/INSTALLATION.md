# Guide d'installation et de déploiement

Ce document explique comment installer, lancer, construire et déployer
**FactureLocale**, ainsi que comment l'installer comme application sur un
téléphone ou un PC.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation des dépendances](#2-installation-des-dépendances)
3. [Lancer en développement](#3-lancer-en-développement)
4. [Construire la version de production](#4-construire-la-version-de-production)
5. [Servir le build hors-ligne](#5-servir-le-build-hors-ligne)
6. [Déploiement avec Docker](#6-déploiement-avec-docker)
7. [Installer l'app sur un appareil (PWA)](#7-installer-lapp-sur-un-appareil-pwa)
8. [Mises à jour](#8-mises-à-jour)
9. [Dépannage](#9-dépannage)

---

## 1. Prérequis

- **Node.js 20 ou supérieur** ([nodejs.org](https://nodejs.org)) et **npm**
  (livré avec Node).
- Pour le déploiement conteneurisé (optionnel) : **Docker** et **Docker Compose**.

Vérifier les versions :

```bash
node -v   # doit afficher v20.x ou plus
npm -v
```

> ⚠️ Internet est nécessaire **uniquement** pour `npm install` (téléchargement des
> dépendances) et pour récupérer le code. Une fois l'application construite, elle
> fonctionne entièrement hors-ligne.

## 2. Installation des dépendances

Depuis la racine du projet :

```bash
npm install
```

Cela télécharge toutes les dépendances dans `node_modules`. C'est l'unique étape
qui requiert une connexion.

## 3. Lancer en développement

```bash
npm run dev
```

Vite démarre un serveur local (par défaut `http://localhost:5173`). Le code se
recharge à chaud à chaque modification. Idéal pour développer.

## 4. Construire la version de production

```bash
npm run build
```

Cette commande :

1. vérifie les types TypeScript (`tsc -b`) ;
2. génère un dossier **`dist/`** contenant tout le nécessaire : HTML, CSS, JS
   (avec toutes les dépendances intégrées), service worker, manifeste PWA.

Le dossier `dist/` est **autosuffisant** : il ne contient aucune référence à un
serveur ou un CDN externe. C'est lui que l'on déploie.

Pour vérifier le build localement :

```bash
npm run preview
```

## 5. Servir le build hors-ligne

`dist/` est un site statique. On peut le servir avec n'importe quel serveur de
fichiers statiques. Exemples :

```bash
# Avec npm preview (simple, pour tester)
npm run preview

# Avec un serveur statique quelconque
npx serve dist
```

Pour un usage purement local sans réseau, on peut aussi pointer un serveur
statique embarqué (nginx, Caddy, etc.) vers `dist/`. La configuration nginx
fournie (`nginx.conf`) gère le fallback SPA et le cache PWA.

> Note : l'ouverture directe de `dist/index.html` via `file://` ne fonctionne
> pas (le service worker et le routage exigent un serveur HTTP, même local).

## 6. Déploiement avec Docker

Le projet inclut un `Dockerfile` (build multi-étapes : compilation puis service
via nginx) et un `docker-compose.yml`.

```bash
# Construire l'image et lancer le conteneur
docker compose up -d --build
```

L'application est alors disponible sur **http://localhost:8080**.

- Étape 1 du Dockerfile : `node:20-alpine` exécute `npm ci` puis `npm run build`.
- Étape 2 : `nginx:1.27-alpine` sert le contenu de `dist/` avec la config
  `nginx.conf` (fallback SPA, cache long sur les assets, pas de cache sur le
  service worker).

Arrêter / supprimer :

```bash
docker compose down
```

## 7. Installer l'app sur un appareil (PWA)

Une fois l'app servie (via `preview`, nginx, Docker, ou un hébergement), elle est
installable comme une application native.

### Sur Android (Chrome)

1. Ouvrir l'URL de l'application dans Chrome.
2. Menu **⋮** → **Ajouter à l'écran d'accueil** (ou bannière « Installer »).
3. L'icône apparaît sur l'écran d'accueil ; l'app s'ouvre en plein écran et
   fonctionne hors-ligne.

### Sur PC (Chrome / Edge)

1. Ouvrir l'URL.
2. Cliquer sur l'icône **Installer** dans la barre d'adresse (ou menu →
   « Installer FactureLocale »).
3. L'app s'ouvre dans sa propre fenêtre.

### Sur iOS (Safari)

1. Ouvrir l'URL dans Safari.
2. Bouton **Partager** → **Sur l'écran d'accueil**.

> Après installation, l'app garde ses données localement et se lance sans réseau.

## 8. Mises à jour

Le service worker est configuré en `autoUpdate` : quand une nouvelle version est
déployée, l'app se met à jour automatiquement au prochain lancement (le
manifeste et le service worker ne sont pas mis en cache, contrairement aux
assets).

Pour déployer une nouvelle version : reconstruire (`npm run build` ou
`docker compose up -d --build`) et redéployer `dist/`.

## 9. Dépannage

| Problème | Piste |
|---|---|
| `npm install` échoue | Vérifier Node ≥ 20 et la connexion Internet. |
| Page blanche après build | Servir via HTTP (pas `file://`) ; vérifier le fallback SPA. |
| L'app ne s'installe pas (pas de bouton) | Le navigateur exige HTTPS (ou `localhost`). En réseau local, utiliser un certificat ou `localhost`. |
| Données disparues | Elles sont liées au navigateur/appareil. Restaurer depuis un export JSON (Paramètres → Sauvegarde). |
| Mise à jour non prise en compte | Fermer toutes les fenêtres de l'app puis rouvrir, ou vider le cache du site. |

---

Pour toute question de sécurité, voir [`../SECURITY.md`](../SECURITY.md). Pour
contribuer, voir [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
