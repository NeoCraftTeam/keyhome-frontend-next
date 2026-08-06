# KeyHome — Frontend Next.js

Application web client de la plateforme immobilière **KeyHome** : espace client chercheur,
espace bailleur/propriétaire intégré, et pages SEO. Authentification Clerk, paiements
Flutterwave, tours virtuels 360°, cartographie Mapbox et internationalisation fr/en.

## Stack technique

| Catégorie             | Technologie                             | Version      |
| --------------------- | --------------------------------------- | ------------ |
| Framework             | Next.js (App Router, Turbopack)         | ^16.2.1      |
| Langage               | TypeScript                              | ^5           |
| UI                    | React                                   | 19.2.3       |
| Design System         | Material-UI (MUI)                       | ^7.3.7       |
| CSS utilitaire        | Tailwind CSS                            | ^4           |
| Animations            | Framer Motion                           | ^12          |
| Cartographie          | Mapbox GL JS + react-map-gl             | ^3.18 / ^8.1 |
| Tours virtuels 360°   | Photo Sphere Viewer                     | ^5.14        |
| Graphiques            | Recharts                                | ^3.8         |
| 3D                    | Three.js                                | ^0.183       |
| State serveur         | TanStack React Query                    | ^5           |
| Authentification      | Clerk (`@clerk/nextjs`)                 | ^6           |
| Client HTTP           | Axios                                   | ^1.13        |
| Formulaires           | React Hook Form + Zod                   | ^7 / ^4      |
| Internationalisation  | next-intl                               | ^4           |
| Notifications UI      | notistack                               | ^3           |
| Monitoring            | Sentry (`@sentry/nextjs`)               | ^10          |
| Analytics             | Vercel Analytics + Speed Insights       | ^1 / ^2      |
| Tests unitaires       | Vitest + Testing Library                | ^4           |
| Tests E2E             | Playwright                              | ^1.58        |
| Composants documentés | Storybook                               | ^8.6         |
| Qualité               | ESLint + Prettier + Husky + lint-staged | —            |

## Architecture du projet

```
src/
├── app/
│   ├── (auth)/                       # Routes authentification client (Clerk)
│   │   ├── login/                    # Connexion
│   │   ├── register/                 # Inscription
│   │   ├── forgot-password/          # Mot de passe oublié
│   │   ├── reset-password/           # Réinitialisation
│   │   ├── verify-email/             # Vérification e-mail
│   │   ├── verify-otp/               # Code OTP
│   │   ├── complete-profile/         # Complétion du profil
│   │   └── auth/callback/            # Callback Clerk OAuth
│   ├── (dashboard)/                  # Espace client authentifié
│   │   ├── home/                     # Accueil avec annonces et recommandations
│   │   ├── search/                   # Recherche avancée
│   │   ├── nearby/                   # Exploration géographique (rayon configurable)
│   │   ├── profile/                  # Profil utilisateur
│   │   ├── payments/                 # Callback de paiement
│   │   ├── my/reservations/          # Mes réservations de visites
│   │   ├── search-alerts/            # Alertes de recherche
│   │   ├── notifications/            # Centre de notifications
│   │   ├── messages/                 # Messagerie
│   │   ├── comparaisons/             # Comparateur d'annonces
│   │   ├── prix-marche/              # Heatmap des prix du marché
│   │   ├── parametres/               # Paramètres utilisateur
│   │   ├── aide/                     # Centre d'aide
│   │   └── contact/                  # Contact
│   ├── (owner)/owner/                # Espace bailleur/propriétaire
│   │   ├── dashboard/                # Tableau de bord analytique
│   │   ├── ads/                      # Gestion des annonces (+ tours 360°)
│   │   ├── availability/             # Gestion des créneaux de visite
│   │   ├── viewings/                 # Visites planifiées
│   │   ├── lease-contracts/          # Contrats de bail
│   │   ├── financials/               # Finances & dépenses
│   │   ├── subscriptions/            # Abonnements
│   │   ├── payments/                 # Paiements & facturation
│   │   ├── reviews/                  # Avis reçus
│   │   ├── tenants/                  # Locataires
│   │   ├── equipe/                   # Équipe / agents
│   │   ├── pro-services/             # Services professionnels
│   │   ├── profile/ security/ parametres/
│   │   └── auth/                     # Auth bailleur (login, register, OTP, complete-profile)
│   ├── ads/[id]/[slug]/              # Détail annonce (SSR + OpenGraph dynamique)
│   ├── agences/[id]/                 # Profil agence public
│   ├── bailleurs/[username]/         # Profil bailleur public
│   ├── search/                       # Recherche publique
│   ├── credits/                      # Achat de crédits + callback
│   ├── payment/ payment-success/     # Flux de paiement Flutterwave
│   ├── immobilier/[ville]/           # SEO : pages par ville
│   ├── type-bien/[type]/             # SEO : pages par type de bien
│   ├── comparaison/[slug]/           # Pages de comparaison SEO
│   ├── sign/[token]/                 # Signature électronique de contrat de bail
│   ├── surveys/ sondage/[id]/        # Sondages publics et anonymes
│   ├── blog/ blog/[slug]/            # Blog
│   ├── conditions/ confidentialite/  # Pages légales
│   ├── sso-callback/                 # Callback SSO Clerk
│   ├── tour-proxy/[[...path]]/       # Proxy sécurisé pour les tours 360°
│   └── offline/ health/
├── components/
│   ├── ads/          # Cartes d'annonces, galeries, lightbox, tours 360°
│   ├── auth/         # Composants d'authentification Clerk / email
│   ├── dashboard/    # Composants espace client
│   ├── landing/      # Page d'accueil marketing
│   ├── layout/       # Navbar, Footer
│   ├── maps/         # Carte Mapbox, markers, heatmap des prix
│   ├── notifications/ # Centre de notifications
│   ├── owner/        # Composants espace bailleur
│   ├── payment/      # Flux de paiement Flutterwave
│   ├── pwa/          # Service Worker, installation PWA
│   ├── reviews/      # Avis et notes
│   ├── seo/          # Meta, OpenGraph, structured data
│   ├── surveys/      # Formulaires de sondage
│   ├── utm/          # Attribution marketing
│   ├── viewing/      # Calendrier de visites
│   └── ui/           # Composants atomiques réutilisables
├── hooks/            # Hooks personnalisés (16 fichiers)
├── lib/
│   ├── api.ts        # Instance Axios + intercepteurs (injection token, redirection 401)
│   └── constants.ts  # Utilitaires (formatPrice, formatDate…)
├── providers/        # AuthProvider, ThemeProvider, QueryProvider…
├── services/         # Appels API par domaine (22 fichiers)
├── theme/
│   ├── tokens.ts     # Design tokens (couleurs, spacing…)
│   ├── theme.ts      # Thème MUI clair + sombre
│   └── ownerTheme.ts # Thème dédié espace bailleur
└── types/            # Types TypeScript globaux
```

## Prérequis

- Node.js ≥ 18.x
- npm ≥ 9.x (ou yarn / pnpm)
- Backend Laravel en cours d'exécution avec l'API KeyHome
- Clé API Mapbox
- Projet Clerk configuré (dashboard.clerk.com)

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` en `.env.local` et remplir les valeurs :

```env
# Backend API
NEXT_PUBLIC_API_URL=https://api.keyhome.app/api/v1
# Timeout upload tours 360° en ms (défaut 600 000 = 10 min, max 1 800 000 = 30 min)
# NEXT_PUBLIC_API_TOUR_UPLOAD_TIMEOUT_MS=600000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Clerk — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/home
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/home

# URLs des panels backend (Laravel)
NEXT_PUBLIC_AGENCY_URL=https://api.keyhome.app/agency
NEXT_PUBLIC_OWNER_URL=https://api.keyhome.app/owner
NEXT_PUBLIC_ADMIN_URL=https://api.keyhome.app/admin
# next = espace bailleur intégré (ce frontend) | laravel = panel Filament
NEXT_PUBLIC_OWNER_PANEL=next

# Web Push (VAPID — générer côté backend : php artisan webpush:vapid)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# Service Worker / PWA (activer en local : 1)
# NEXT_PUBLIC_ENABLE_SW=1

# Contact
NEXT_PUBLIC_WHATSAPP_NUMBER=237657507909
```

## Scripts

```bash
npm run dev              # Serveur de développement (Turbopack)
npm run dev:webpack      # Serveur de développement (webpack)
npm run dev:clean        # Purge .next puis dev
npm run build            # Build de production
npm start                # Serveur de production
npm run lint             # ESLint
npm run format           # Prettier (fix)
npm run format:check     # Prettier (vérification)
npm run test             # Tests unitaires (Vitest, exécution unique)
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec rapport de couverture
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Interface Playwright UI
npm run prepare:e2e      # Installer Chromium pour Playwright
npm run analyze          # Analyse du bundle (ANALYZE=true next build)
npm run storybook        # Storybook (port 6006)
npm run build-storybook  # Build Storybook statique
```

## Authentification

L'application utilise **Clerk** comme fournisseur d'identité principal :

1. **Espace client** : connexion/inscription via Clerk UI. Le JWT Clerk est échangé
   côté backend via `POST /api/v1/auth/clerk/exchange` → retourne un token Sanctum (`kh_*`).
2. **Espace bailleur** (`/owner`) : authentification email/mot de passe native via l'API backend (Sanctum).
3. **OAuth** : Google, Facebook, Apple (géré par Socialite côté backend).
4. Le token est stocké en cookie côté client et injecté automatiquement par Axios dans chaque requête.
5. Redirection automatique vers `/login` sur erreur 401.

## Paiement (Flutterwave)

- Initialisation côté backend (`POST /api/v1/payments/initialize`) — le montant n'est **jamais** défini côté client.
- Redirection vers la passerelle Flutterwave.
- Vérification via webhook Flutterwave (côté serveur).
- Types : déblocage d'annonce, abonnement, boost, achat de crédits.

## Fonctionnalités principales

### Espace client

- Catalogue d'annonces : pagination, filtres (ville, type, surface, prix, chambres)
- Détail d'annonce : galerie Airbnb-style, lightbox, coordonnées floutées jusqu'au paiement
- Tours virtuels 360° (Photo Sphere Viewer + cubemap adapter)
- Carte interactive Mapbox : vue split liste/carte, pins de prix, heatmap
- Recherche géographique (géolocalisation navigateur, rayon configurable)
- Recherche en langage naturel (IA)
- Alertes de recherche avec notifications push/email et temps réel
- Messagerie temps réel avec les bailleurs (bulles façon Messenger, réactions, pièces jointes, notes vocales)
- Comparateur d'annonces
- Estimateur de prix/loyer
- Profil utilisateur, annonces débloquées, réservations de visites

### Espace bailleur (`/owner`)

- Publication & gestion des annonces (avec upload de tours 360°)
- Calendrier de disponibilités & planification des visites
- Contrats de bail & signatures électroniques
- Gestion des locataires & documents
- Suivi des paiements & dépenses
- Dashboard analytique (vues, clics, favoris — Recharts)
- Gestion des abonnements & crédits
- Messagerie temps réel avec les prospects (même moteur que côté client)
- Notifications Web Push et WhatsApp

### SEO & Performance

- Pages statiques par ville (`/immobilier/[ville]`) et par type (`/type-bien/[type]`)
- OpenGraph dynamique par annonce avec image de prévisualisation
- PWA : Service Worker, mode hors-ligne, installation sur écran d'accueil
- Optimisation images (`next/image`), Turbopack, bundle analyzer

## Temps réel (Laravel Echo / Reverb)

Le frontend consomme le broadcasting Reverb du backend via `laravel-echo`
(singleton dans `src/lib/chat/echo.ts`, auth Sanctum sur
`POST /broadcasting/auth`). Des listeners globaux sont montés dans les
layouts authentifiés (`(dashboard)/layout.tsx`, `OwnerLayoutClient.tsx`) :

| Listener                        | Canal / event                                                                        | Effet                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `ChatNotificationListener`      | `user.{id}` → `message.received` + `conversation.{uuid}` (fil ouvert, read receipts) | Toast « Voir », badge non-lu, inbox live — couvre aussi les conversations neuves |
| `CreditsRealtimeListener`       | `user.{id}` → `credits.updated`                                                      | Solde de crédits + historique de transactions en direct                          |
| `NotificationsRealtimeListener` | `user.{id}` → `search_alert.match`                                                   | Centre de notifications invalidé en direct + toast vers la fiche annonce         |
| `GlobalPresenceChannel`         | `online-users` (presence)                                                            | Pastilles « en ligne »                                                           |
| `useChatChannel` (fil ouvert)   | `conversation.{uuid}` → `message.sent`, `messages.read`, `user.typing`, réactions…   | Messages, accusés de lecture et indicateur de frappe en direct                   |

Règles : `message.received` est la source unique pour inbox/badge/toast
(les bindings par conversation ne doublent jamais ces effets) ; cleanup avec
`stopListening()` et non `leave()` car le canal `user.{id}` est partagé.
Sans `NEXT_PUBLIC_REVERB_APP_KEY`/`NEXT_PUBLIC_REVERB_HOST`, tout se
désactive proprement (repli polling).

## Services API consommés

| Fichier service                  | Domaine                                           |
| -------------------------------- | ------------------------------------------------- |
| `ads.service.ts`                 | Annonces (CRUD, search, nearby, boost)            |
| `auth.service.ts`                | Authentification                                  |
| `users.service.ts`               | Utilisateurs, profil, recommandations             |
| `payments.service.ts`            | Paiements Flutterwave                             |
| `credits.service.ts`             | Achat et solde de crédits                         |
| `cities.service.ts`              | Villes & quartiers                                |
| `subscriptions.service.ts`       | Abonnements & plans                               |
| `geo.service.ts`                 | Isochrones, directions, heatmap                   |
| `viewings.service.ts`            | Disponibilités & réservations de visites          |
| `reviews.service.ts`             | Avis et notes                                     |
| `notifications.service.ts`       | Notifications & préférences                       |
| `searchAlerts.service.ts`        | Alertes de recherche                              |
| `surveys.service.ts`             | Sondages authentifiés                             |
| `publicSurveys.service.ts`       | Sondages anonymes                                 |
| `ad-reports.service.ts`          | Signalements d'annonces                           |
| `agency.service.ts`              | Agences                                           |
| `owner.service.ts`               | Espace bailleur (annonces, finances, locataires…) |
| `property-attributes.service.ts` | Attributs et catégories de biens                  |
| `estimator.service.ts`           | Estimation de prix/loyer                          |

## Sécurité

En-têtes HTTP stricts configurés dans `next.config.ts` :

- **CSP** (Content Security Policy) — sources de scripts/styles/images restreintes (Mapbox, API KeyHome)
- **X-XSS-Protection** — protection XSS cross-site
- **X-Frame-Options: SAMEORIGIN** — protection clickjacking
- **X-Content-Type-Options: nosniff** — prévention MIME sniffing

⚠️ En production : `NEXT_PUBLIC_API_URL` doit pointer vers une URL **HTTPS** pour éviter
tout problème Mixed Content ou fuite de données.

## Charte graphique

| Couleur    | Hex       | Usage                        |
| ---------- | --------- | ---------------------------- |
| Primary    | `#F6475F` | Boutons, liens, accents, CTA |
| Dark       | `#222222` | Textes principaux, titres    |
| Grey       | `#DDDDDD` | Bordures, séparateurs        |
| Background | `#F7F7F7` | Arrière-plan des pages       |

Design inspiré d'Airbnb : cartes arrondies, galeries photo, barre de recherche arrondie.
Tokens dans `src/theme/tokens.ts`. Thème MUI dans `src/theme/theme.ts`.
L'espace bailleur possède son propre thème (`src/theme/ownerTheme.ts`).

## Déploiement

### Variables d'environnement production

```env
NEXT_PUBLIC_API_URL=https://api.keyhome.app/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/home
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/home
NEXT_PUBLIC_OWNER_PANEL=next
NEXT_PUBLIC_AGENCY_URL=https://api.keyhome.app/agency
NEXT_PUBLIC_ADMIN_URL=https://api.keyhome.app/admin
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

### Vercel (recommandé)

```bash
npm i -g vercel
vercel
```

Configurer les variables d'environnement dans le dashboard Vercel.

### Docker

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

## Licence

Projet privé — NeoCraft. Tous droits réservés.
