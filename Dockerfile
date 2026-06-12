# --- Étape 1 : build de la PWA ---
FROM node:20-alpine AS build
WORKDIR /app

# Dépendances (cache tant que les lockfiles ne changent pas).
COPY package.json package-lock.json ./
RUN npm ci

# Code source + build de production (génère /app/dist).
COPY . .
RUN npm run build

# --- Étape 2 : service des fichiers statiques ---
FROM nginx:1.27-alpine AS runtime

# Config nginx : fallback SPA + en-têtes de cache adaptés à la PWA.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
