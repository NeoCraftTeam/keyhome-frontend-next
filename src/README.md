# KeyHome Frontend — Guide d'orientation (`src/`)

> Stack : **Next.js 16 App Router · TypeScript · MUI · TanStack Query · Clerk**  
> UI language : **français uniquement** (`fr_FR`)

---

## Structure de dossiers

```
src/
├── app/                   Routes Next.js (App Router)
│   ├── (auth)/            Pages login / register (route group — pas dans l'URL)
│   ├── (owner)/owner/     Panel bailleur (dashboard, annonces, locataires…)
│   ├── ads/[slug]/        Fiche annonce publique
│   ├── search/            Recherche publique
│   └── …
│
├── components/            Composants React, groupés par domaine
│   ├── ads/               Composants liés aux annonces
│   ├── auth/              Login, Register, Passkey, Social
│   ├── chat/              Chat en temps réel (Reverb + E2EE)
│   ├── owner/             Composants panel bailleur
│   ├── payment/           Flux paiement (GeniusPay, Stripe)
│   ├── ui/                Composants UI génériques (boutons, dialogs…)
│   └── …
│
├── hooks/                 React hooks personnalisés (useChat, usePresence…)
│
├── lib/                   Utilitaires et logique pure (pas de JSX)
│   ├── auth/              Session, tokens, Clerk, OAuth, passkeys
│   ├── chat/              API chat, E2EE crypto, Echo, conversation utils
│   ├── payment/           Stripe, GeniusPay return, historique
│   ├── tour/              PSV / Pannellum (visites 3D panoramiques)
│   ├── owner/             Auth bailleur, thème, dashboard analytics
│   ├── geo/               Géolocalisation
│   ├── seo/               SEO verification, CSP allowlist
│   ├── analytics/         Clarity, Meta Pixel, TikTok Pixel
│   └── *.ts               Utilitaires généraux (currency, api, constants…)
│
├── services/              Appels API REST vers le backend Laravel
│   ├── owner/             Services domaine bailleur (barrel index.ts inclus)
│   ├── ads.service.ts
│   ├── auth.service.ts
│   ├── payments.service.ts
│   └── …
│
├── types/                 Types TypeScript partagés (Ad, User, Payment…)
├── hooks/                 Hooks React réutilisables
├── providers/             Context providers (Auth, Theme, Query…)
├── theme/                 Configuration MUI theme
├── i18n/                  Internationalisation (fr_FR)
└── tests/                 Tests unitaires (Vitest)
```

---

## Conventions

| Règle                       | Exemple           |
| --------------------------- | ----------------- |
| Composant → PascalCase      | `AdCard.tsx`      |
| Hook → `use` prefix         | `useChat.ts`      |
| Service API → `.service.ts` | `ads.service.ts`  |
| Lib util → kebab-case       | `auth-session.ts` |
| Types → `types/`            | `types/ad.ts`     |
| Constantes brand →          | `lib/brand.ts`    |

---

## Flux d'authentification

```
Client (Next.js)  ─→  Clerk (JWT)  ─→  Backend Laravel (auth:sanctum)
                   └─→  Owner Panel  ─→  Sanctum token (email+mdp)
```

Fichiers clés : `lib/auth/auth-session.ts`, `providers/AuthProvider.tsx`, `services/auth.service.ts`

---

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:3000
```

Variables d'environnement : copier `.env.example` → `.env.local`

---

## Écrire un test

Tests dans `src/tests/` avec **Vitest** :

```bash
npm run test
```
