# KeyHome - Frontend Next.js

Application web client pour la plateforme immobiliere **KeyHome**, dediee a la recherche et a la consultation d'annonces immobilieres au Cameroun. Ce frontend communique avec une API REST Laravel via des requetes authentifiees (Sanctum token-based).

## Objectifs du projet

- Offrir une experience utilisateur fluide et moderne pour la recherche de biens immobiliers
- Proposer un systeme de consultation avec deverrouillage payant (blur-to-pay) via FedaPay
- Integrer la geolocalisation avec affichage interactif sur carte Mapbox
- Garantir une interface responsive, performante et accessible sur tous les appareils

## Fonctionnalites cles

- **Authentification complete** : connexion, inscription client, reinitialisation et verification d'email via Laravel Sanctum
- **Catalogue d'annonces** : affichage en grille responsive avec pagination optimisee, filtres par ville, type de bien, surface, prix, nombre de chambres
- **Detail d'annonce** : galerie photo Airbnb-style, lightbox, informations floutees jusqu'au paiement
- **Paiement securise** : integration FedaPay pour le deverrouillage des coordonnees et photos
- **Carte interactive** : recherche geographique, affichage des annonces avec pins de prix sur Mapbox
- **Recherche avancee** : autocomplete sur villes et types de bien, vue split liste/carte
- **Exploration proximite** : geolocalisation du navigateur, rayon de recherche configurable
- **Profil utilisateur** : edition des informations, upload d'avatar, changement de mot de passe, historique des annonces deverrouillees
- **Theming** : mode clair/sombre avec basculement dynamique
- **Animations** : transitions FadeIn, skeleton loading, loaders animes

## Stack technique

| Categorie | Technologie | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Langage | TypeScript | ^5 |
| UI | React | 19.2.3 |
| Design System | Material-UI (MUI) | ^7.3.7 |
| Styling | Emotion (`@emotion/react`, `@emotion/styled`) | ^11.14.x |
| CSS Utilitaire | Tailwind CSS | ^4 |
| Cartographie | Mapbox GL JS | ^3.18.1 |
| Cartographie React | react-map-gl | ^8.1.0 |
| State serveur | TanStack React Query | ^5.90.21 |
| Client HTTP | Axios | ^1.13.5 |
| Formulaires | React Hook Form | ^7.71.1 |
| Validation | Zod | ^4.3.6 |
| Resolvers | @hookform/resolvers | ^5.2.2 |
| Dates | date-fns | ^4.1.0 |
| Cookies | nookies | ^2.5.2 |
| Linting | ESLint + eslint-config-next | ^9 / 16.1.6 |
| PostCSS | @tailwindcss/postcss | ^4 |

## Architecture du projet

```
src/
├── app/                          # Routes Next.js (App Router)
│   ├── (auth)/                   # Groupe de routes authentification
│   │   ├── login/                # Page de connexion
│   │   ├── register/             # Page d'inscription client
│   │   ├── forgot-password/      # Mot de passe oublie
│   │   ├── reset-password/       # Reinitialisation du mot de passe
│   │   ├── verify-email/         # Verification d'email
│   │   └── layout.tsx            # Layout auth (sans navbar)
│   ├── (dashboard)/              # Groupe de routes authentifiees
│   │   ├── home/                 # Page d'accueil avec annonces
│   │   ├── ads/[id]/[slug]/      # Detail d'une annonce
│   │   ├── search/               # Recherche avancee
│   │   ├── nearby/               # Exploration geographique
│   │   ├── profile/              # Gestion du profil
│   │   ├── payments/             # Callback de paiement FedaPay
│   │   └── layout.tsx            # Layout dashboard (navbar + footer)
│   ├── globals.css               # Styles globaux et animations CSS
│   ├── layout.tsx                # Layout racine (providers)
│   ├── providers.tsx             # Assemblage des providers
│   └── page.tsx                  # Redirection initiale
├── components/
│   ├── ads/
│   │   ├── AdCard.tsx            # Carte d'annonce reutilisable
│   │   └── AdCardSkeleton.tsx    # Skeleton loading pour les cartes
│   ├── layout/
│   │   ├── Navbar.tsx            # Barre de navigation principale
│   │   └── Footer.tsx            # Pied de page
│   └── ui/
│       ├── FadeIn.tsx            # Composant d'animation fade-in
│       ├── PageLoader.tsx        # Loader de page avec logo anime
│       └── CategoryPills.tsx     # Pilules de categories scrollables
├── lib/
│   ├── api.ts                    # Instance Axios + intercepteurs
│   └── constants.ts              # Utilitaires (formatPrice, formatDate...)
├── providers/
│   ├── AuthProvider.tsx          # Contexte d'authentification
│   ├── ThemeProvider.tsx         # Contexte theme clair/sombre
│   └── QueryProvider.tsx         # Provider TanStack Query
├── services/
│   ├── ads.service.ts            # API annonces (CRUD, search, nearby)
│   ├── auth.service.ts           # API authentification
│   ├── cities.service.ts         # API villes
│   ├── payments.service.ts       # API paiements FedaPay
│   └── users.service.ts          # API utilisateurs + recommandations
├── theme/
│   └── theme.ts                  # Themes MUI (light + dark)
└── types/
    └── index.ts                  # Types TypeScript (Ad, User, City, etc.)
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (ou yarn/pnpm)
- Un **backend Laravel** en cours d'execution avec l'API KeyHome
- Une **cle API Mapbox** pour les fonctionnalites cartographiques

## Installation

```bash
# Cloner le repository
git clone git@gitlab.com:neocraft/keyhome-next.git
cd keyhome-next

# Installer les dependances
npm install
```

## Configuration

Creer un fichier `.env.local` a la racine du projet :

```env
NEXT_PUBLIC_API_URL=https://api.keyhome.neocraft.dev/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API Laravel (avec `/api/v1`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Token public Mapbox GL pour les cartes interactives |

## Scripts disponibles

```bash
# Demarrer le serveur de developpement (Turbopack)
npm run dev

# Creer un build de production optimise
npm run build

# Demarrer le serveur de production
npm start

# Executer le linter ESLint
npm run lint
```


## Sécurité

L'application inclut des en-têtes de sécurité HTTP stricts configurés dans `next.config.ts` :

- **CSP (Content Security Policy)** : Restreint les sources de scripts/styles/images (Mapbox, API KeyHome uniquement).
- **X-XSS-Protection** : Bloque les attaques XSS cross-site.
- **X-Frame-Options** : Empêche le clickjacking (SAMEORIGIN).
- **X-Content-Type-Options** : Empêche le sniffing MIME.

⚠️ **Important en Production** :
Assurez-vous que `NEXT_PUBLIC_API_URL` pointe vers une URL HTTPS sécurisée (ex: `https://api.keyhome.cm/api/v1`) pour éviter toute fuite de données ou problèmes de Mixed Content.

## Details des dependances

### Framework et rendu

- **Next.js 16** : framework React avec App Router, rendu hybride (SSR/SSG), optimisation automatique des images via `next/image`, et bundling Turbopack
- **React 19** : bibliotheque UI avec les derniers hooks et le support concurrent
- **TypeScript 5** : typage statique pour une meilleure maintenabilite et detection d'erreurs a la compilation

### Interface utilisateur

- **Material-UI (MUI) 7** : design system complet avec composants preconçus (Button, TextField, Dialog, Autocomplete, Grid, Tabs, etc.)
- **@mui/icons-material** : pack d'icones Material Design
- **Emotion** (`@emotion/react`, `@emotion/styled`) : moteur CSS-in-JS utilise par MUI pour le styling dynamique et le theming
- **Tailwind CSS 4** : classes utilitaires CSS pour le layout, le spacing et les ajustements rapides, integre via PostCSS

### Gestion de l'etat et des donnees

- **TanStack React Query 5** : gestion de l'etat serveur avec cache automatique, revalidation, pagination optimisee (`keepPreviousData`), et requetes conditionnelles
- **Axios** : client HTTP avec intercepteurs pour l'injection automatique du token d'authentification et la redirection sur erreur 401
- **nookies** : gestion des cookies cote client et serveur pour le stockage du token d'authentification

### Formulaires et validation

- **React Hook Form 7** : gestion performante des formulaires avec un minimum de re-renders
- **Zod 4** : schema de validation declaratif et type-safe
- **@hookform/resolvers** : pont entre React Hook Form et Zod pour une validation integree

### Cartographie

- **Mapbox GL JS 3** : rendu de cartes interactives WebGL haute performance avec markers personnalises, popups, et controles de navigation
- **react-map-gl 8** : wrapper React pour Mapbox GL avec integration declarative

### Utilitaires

- **date-fns 4** : manipulation et formatage de dates (dates relatives, localisation francaise)

## Charte graphique

La palette de couleurs est basee sur les maquettes de l'application mobile KeyHome :

| Couleur | Hex | Usage |
|---------|-----|-------|
| Primary | `#F6475F` | Boutons, liens, accents, CTA |
| Dark | `#222222` | Textes principaux, titres |
| Grey | `#DDDDDD` | Bordures, separateurs |
| Background | `#F7F7F7` | Arriere-plan des pages |

Le design suit une approche inspiree d'Airbnb : cartes a bords arrondis, galeries photos, barre de recherche arrondie, navigation epuree.

## Communication avec le backend

L'application communique avec l'API Laravel via une instance Axios configuree dans `src/lib/api.ts` :

- **Authentification** : token Bearer stocke dans un cookie (`auth_token`), injecte automatiquement dans chaque requete
- **Gestion des erreurs** : interception des reponses 401 pour deconnexion automatique et redirection vers `/login`
- **Base URL** : configurable via la variable d'environnement `NEXT_PUBLIC_API_URL`

### Endpoints principaux consommes

| Service | Endpoints |
|---------|-----------|
| Auth | `POST /login`, `POST /register/customer`, `POST /forgot-password`, `POST /reset-password`, `GET /user` |
| Annonces | `GET /ads`, `GET /ads/{id}`, `GET /ads/search`, `GET /ads/nearby` |
| Paiements | `POST /payments/initialize` |
| Villes | `GET /cities` |
| Utilisateurs | `PUT /user`, `POST /user/avatar`, `PUT /user/password` |

## Deploiement

### Vercel (recommande)

```bash
# Installer Vercel CLI
npm i -g vercel

# Deployer
vercel
```

Configurer les variables d'environnement dans le dashboard Vercel.

### Docker (alternatif)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables d'environnement de production

```env
NEXT_PUBLIC_API_URL=https://api.keyhome.cm/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
```

## Licence

Projet prive - NeoCraft. Tous droits reserves.
