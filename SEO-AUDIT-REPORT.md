# 🔍 Rapport d'Audit SEO Complet — KeyHome (keyhome.app)

> **Date** : 1er mars 2026  
> **Consultant** : Expert SEO / Technical Audit  
> **Stack technique détectée** : Next.js 16.1.6, React 19, Clerk Auth, MUI 7, Tailwind CSS 4, Mapbox GL, Vercel (hébergement), Sentry (monitoring)  
> **Langue principale** : Français | **Secondaire** : Anglais  
> **Pays cibles** : Cameroun, Bénin, Togo, Côte d'Ivoire, Ghana, Mali, Sénégal

---

## Table des matières

1. [Audit SEO Technique](#1-audit-seo-technique)
2. [Recherche de mots-clés](#2-recherche-de-mots-clés)
3. [Stratégie de contenu](#3-stratégie-de-contenu)
4. [Checklist SEO On-Page](#4-checklist-seo-on-page)
5. [SEO Off-Page](#5-seo-off-page)
6. [Mesure et suivi](#6-mesure-et-suivi)

---

## 1. AUDIT SEO TECHNIQUE

### 1.1 🚨 Rendu côté client de la page d'accueil (CRITIQUE)

**Constat simulé** : La landing page (`src/app/page.tsx`) utilise la directive `'use client'`. L'intégralité du contenu visible (HeroSection, FeaturesSection, HowItWorksSection, TestimonialsSection, CTASection) est rendue côté client via JavaScript. Googlebot voit une page quasi-vide avec un simple `<CircularProgress />` au premier rendu HTML.

**Impact SEO** : Le contenu le plus important du site (proposition de valeur, mots-clés principaux, CTA) est invisible dans le HTML initial. Cela affecte directement :
- L'indexation du contenu principal
- Les extraits enrichis (featured snippets)
- Le crawl budget (Google doit exécuter le JS)

**Comment vérifier** :
1. Ouvrir Chrome → `Ctrl+U` (View Source) sur `https://keyhome.app` → le HTML ne contiendra aucun texte marketing
2. Google Search Console → Inspection d'URL → Comparer « HTML vu par Google » vs « Résultat rendu »
3. `curl -s https://keyhome.app | grep -i "immobilier"` — retournera probablement 0 résultat

**Recommandations (Priorité P0)** :
- **Refactoriser `page.tsx`** : Déplacer la logique d'authentification dans un middleware Next.js ou utiliser `auth()` côté serveur (Clerk RSC) pour la redirection. Le composant `<LandingPage />` doit être rendu en Server Component
- **Extraire les composants interactifs** : Seuls les éléments avec `useState`/`useEffect` (ThreeCanvas, animations Framer Motion) doivent garder `'use client'`. Le texte, les titres H1/H2, les descriptions doivent être du HTML statique côté serveur
- **Quick fix immédiat** : Utiliser `middleware.ts` de Clerk pour rediriger les utilisateurs authentifiés avant le rendu de la page

### 1.2 🚨 Pages annonces derrière authentification (CRITIQUE)

**Constat simulé** : Les pages `/ads/[id]/[slug]` sont dans le groupe `(dashboard)` dont le layout (`src/app/(dashboard)/layout.tsx`) redirige vers `/login` tout utilisateur non authentifié. Bien que `generateMetadata()` fonctionne côté serveur, Googlebot est potentiellement redirigé vers `/login` car le layout client exécute `router.replace('/login')`.

**Impact SEO** : Les pages de détail d'annonces — qui ont une excellente configuration metadata (title dynamique, OG, Twitter, canonical) — ne sont probablement jamais indexées.

**Comment vérifier** :
1. Google Search Console → Inspection d'URL → Tester une URL d'annonce
2. `site:keyhome.app/ads` dans Google → Compter les résultats
3. Screaming Frog → Crawler l'URL `/ads/1/example-slug` → Vérifier le status code et le contenu HTML

**Recommandations (Priorité P0)** :
- **Sortir `/ads/[id]/[slug]` du groupe `(dashboard)`** : Créer une route publique `/ads/[id]/[slug]` en dehors du layout authentifié
- **Implémenter un rendu hybride** : Afficher le contenu de l'annonce (titre, description, photos, localisation, prix) publiquement, et réserver le déblocage des coordonnées derrière l'authentification
- **Ajouter du JSON-LD `RealEstateListing`** à chaque page d'annonce (schema Product/Offer avec prix, localisation, images)

### 1.3 🚨 Pages /search et /home derrière authentification (CRITIQUE)

**Constat simulé** : `/search` et `/home` sont les pages les plus importantes pour le SEO immobilier, mais elles sont auth-gated dans le layout `(dashboard)`. Un utilisateur non connecté (y compris Googlebot) est redirigé vers `/login`.

**Impact SEO** : Perte massive de trafic organique. Les requêtes « appartement à louer Douala », « recherche logement Abidjan » ne peuvent pas atterrir sur des pages de résultats.

**Comment vérifier** :
1. Ouvrir `https://keyhome.app/search` en navigation privée → Vérifier si redirection vers `/login`
2. Google Search Console → Rapport Couverture → Chercher les URLs `/search` et `/home`

**Recommandations (Priorité P0)** :
- Rendre `/search` publiquement accessible avec les résultats de recherche visibles
- Implémenter un modèle « freemium » : les annonces sont visibles, mais le contact est verrouillé
- Créer des pages de résultats filtrés par ville indexables : `/search?city=douala`, `/search?city=abidjan`

### 1.4 📱 Compatibilité Mobile

**Constat simulé** : Le site est globalement mobile-friendly grâce à MUI responsive + Tailwind CSS. Cependant, des problèmes potentiels :
- Le canvas Three.js (HeroSection) peut ralentir les mobiles d'entrée de gamme courants en Afrique
- Certaines zones tactiles (boutons CTA dans le footer) pourraient être trop petites

**Comment vérifier** :
1. Google PageSpeed Insights → Section « Mobile » → `https://pagespeed.web.dev/`
2. Chrome DevTools → `F12` → Toggle Device Toolbar → Tester sur « Moto G Power » et « Samsung Galaxy A13 »
3. Google Mobile-Friendly Test (déprécié mais encore accessible) → `https://search.google.com/test/mobile-friendly`
4. Lighthouse → Onglet « SEO » → Vérifier « Tap targets are sized appropriately »

**Recommandations** :
- Ajouter un fallback statique pour Three.js sur mobile (image ou animation CSS simple) via `matchMedia` ou un simple `useMediaQuery`
- Garantir `min-height: 48px` et `min-width: 48px` pour tous les boutons tactiles
- Tester sur des appareils réels avec connexion 3G (profil courant en Afrique subsaharienne)

### 1.5 ⚡ Vitesse de chargement (Core Web Vitals)

**Constat simulé (métriques plausibles)** :

| Métrique | Mobile | Desktop | Seuil Google |
|----------|--------|---------|-------------|
| **LCP** (Largest Contentful Paint) | 3.8s ⚠️ | 1.9s ✅ | < 2.5s |
| **INP** (Interaction to Next Paint) | 250ms ⚠️ | 90ms ✅ | < 200ms |
| **CLS** (Cumulative Layout Shift) | 0.18 ⚠️ | 0.05 ✅ | < 0.1 |

**Causes probables** :
- **LCP élevé sur mobile** : Le canvas Three.js + chargement de `framer-motion` + MUI bundle size (très lourd). La landing page charge `mapbox-gl` via les imports transitifs
- **CLS** : Le `CircularProgress` affiché pendant le chargement auth puis remplacé par la landing page provoque un layout shift
- **INP** : Les animations Framer Motion + les hydratation React côté client

**Comment vérifier** :
1. Google PageSpeed Insights : `https://pagespeed.web.dev/analysis?url=https://keyhome.app`
2. Chrome DevTools → Lighthouse → Performance
3. Chrome DevTools → Performance tab → Record → Analyser le waterfall
4. `web-vitals` library : Ajouter dans le code pour monitoring continu

**Recommandations (Priorité P1)** :
- **Lazy-load Three.js** : Utiliser `dynamic(() => import('./ThreeCanvas'), { ssr: false, loading: () => <StaticGradientFallback /> })` — déjà fait avec `dynamic` mais ajouter un `loading` fallback statique
- **Réduire le bundle MUI** : Utiliser les imports barrel optimisés (`@mui/material/Button` au lieu de `@mui/material`)
- **Preconnect** aux domaines critiques : `<link rel="preconnect" href="https://api.mapbox.com" />` et Clerk
- **Implémenter le skeleton screen** au lieu du `CircularProgress` pour réduire le CLS
- **Différer les animations Framer Motion** : Charger `framer-motion` de façon asynchrone ou utiliser des animations CSS natives pour le above-the-fold

### 1.6 🔒 HTTPS & Sécurité

**Constat simulé** : ✅ Excellent. HTTPS correctement configuré avec des headers de sécurité robustes.

**Headers détectés dans `next.config.ts`** :
- ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- ✅ `Content-Security-Policy` complète
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` restrictive
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ Cache immutable pour `/images/*` et `/fonts/*`

**Comment vérifier** :
1. `curl -I https://keyhome.app` → Vérifier tous les headers de réponse
2. SSL Labs : `https://www.ssllabs.com/ssltest/analyze.html?d=keyhome.app`
3. Security Headers : `https://securityheaders.com/?q=keyhome.app`

**Recommandations** :
- Soumettre le domaine au HSTS Preload List : `https://hstspreload.org/`
- Aucun problème de mixed content détecté (CSP stricte) — ✅

### 1.7 🗺️ Sitemap.xml

**Constat simulé** : ⚠️ Sitemap présent (`src/app/sitemap.ts`) mais **gravement incomplet**. Seulement 8 URLs statiques :

```
https://keyhome.app/
https://keyhome.app/login
https://keyhome.app/register
https://keyhome.app/home
https://keyhome.app/search
https://keyhome.app/nearby
https://keyhome.app/conditions
https://keyhome.app/confidentialite
```

**Problèmes** :
- ❌ Aucune page d'annonce `/ads/[id]/[slug]` (potentiellement des centaines/milliers d'URLs)
- ❌ Pas de pages de ville
- ⚠️ Inclut `/login` et `/register` (faible valeur SEO)
- ⚠️ Inclut `/home` et `/nearby` qui sont auth-gated (Google ne peut pas les crawler)

**Comment vérifier** :
1. `https://keyhome.app/sitemap.xml` → Compter les URLs
2. Google Search Console → Sitemaps → Vérifier le statut de soumission
3. Screaming Frog → Mode Liste → Importer les URLs du sitemap → Vérifier les status codes

**Recommandations (Priorité P1)** :
```typescript
// Exemple de sitemap dynamique amélioré
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyhome.app';
  
  // Pages statiques
  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/search`, changeFrequency: 'daily', priority: 0.9 },
    // ... pages de ville
  ];
  
  // Pages dynamiques depuis l'API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads?per_page=5000`);
  const ads = await res.json();
  
  const adPages = ads.data.map((ad) => ({
    url: `${baseUrl}/ads/${ad.id}/${ad.slug}`,
    lastModified: ad.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  
  return [...staticPages, ...adPages];
}
```

- Implémenter un **sitemap index** si > 50 000 URLs
- Soumettre le sitemap dans Google Search Console
- Retirer les pages auth-gated et les pages d'authentification du sitemap

### 1.8 🤖 Robots.txt

**Constat simulé** : ✅ Bien configuré.

**Contenu actuel** :
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /complete-profile
Disallow: /verify-email
Disallow: /verify-otp
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /sso-callback
Disallow: /payment-success
Disallow: /profile
Disallow: /payments
Disallow: /publish
Sitemap: https://keyhome.app/sitemap.xml
```

**Points positifs** :
- ✅ Bloque correctement les pages sensibles (auth flow, paiement, profil)
- ✅ Référence le sitemap
- ✅ Autorise le crawl général

**Recommandations mineures** :
- Ajouter `Disallow: /sso-callback/` (avec trailing slash aussi)
- Ajouter `Crawl-delay: 1` pour les bots agressifs (optionnel)
- Considérer un `robots.txt` dynamique via `src/app/robots.ts` (Next.js natif) pour plus de contrôle

### 1.9 🔗 Liens cassés (404s)

**Constat simulé** : 3-5 erreurs 404 potentielles détectées :
- `/search?q=...` redirige vers `/login` pour les utilisateurs non authentifiés (soft 404)
- L'image `/images/og-cover.png` référencée dans les metadata OpenGraph — **vérifier que ce fichier existe réellement** dans `/public/images/` (non trouvé dans l'arborescence fournie)
- Liens internes vers `/home` depuis la page 404 — redirige vers `/login` si non authentifié

**Comment vérifier** :
1. Screaming Frog SEO Spider → Crawler `https://keyhome.app` → Filtrer par Status Code 404
2. Google Search Console → Pages → Filtrer « Non trouvée (404) »
3. `npx broken-link-checker https://keyhome.app --recursive`
4. Ahrefs → Site Audit → Broken Links

**Recommandations** :
- Créer le fichier `/public/images/og-cover.png` s'il n'existe pas (impacte le partage social)
- Mettre en place des redirections 301 pour les anciennes URLs
- La page `not-found.tsx` existe et est fonctionnelle ✅

### 1.10 📊 Statut d'indexation Google

**Constat simulé** : Environ 5-15 pages indexées (seulement les pages statiques). Les pages d'annonces et de recherche sont probablement **non indexées** à cause du gate d'authentification.

**Comment vérifier** :
1. `site:keyhome.app` dans Google → Compter les résultats
2. `site:keyhome.app/ads` → Vérifier si des annonces apparaissent
3. Google Search Console → Pages → Rapport d'indexation complet
4. GSC → Inspection d'URL → Tester les pages critiques individuellement

**Recommandations** :
- Après correction des problèmes d'auth-gating (§1.2, §1.3), soumettre les nouvelles URLs dans GSC
- Utiliser la Google Indexing API pour les nouvelles annonces (notification push à Google)
- Objectif : passer de ~10 pages indexées à 500+ en 6 mois

### 1.11 📄 Contenu dupliqué

**Constat simulé** : Risque faible actuellement, mais attention aux cas suivants :
- Les pages `/login` et `/register` redirigent potentiellement vers le même flow Clerk
- La page `/home` et `/` servent du contenu différent (home = dashboard, / = landing) — ✅ correct
- Pas de paramètres de pagination ou de filtres dans les URLs actuellement

**Comment vérifier** :
1. Screaming Frog → Content → Near Duplicates
2. Copyscape → Vérifier la landing page
3. `site:keyhome.app` → Chercher des titres identiques dans les résultats

**Recommandations** :
- ✅ Les balises `canonical` sont correctement implémentées
- S'assurer que les futures pages de recherche avec filtres utilisent `canonical` vers l'URL sans paramètres ou avec paramètres significatifs
- Pour les pages de pagination : `<link rel="canonical" href="/search?page=1" />`

### 1.12 🏷️ Meta Titles & Descriptions

**Constat simulé** : ✅ Globalement excellent pour les pages existantes.

| Page | Title | Description | Canonical | Verdict |
|------|-------|-------------|-----------|---------|
| `/` (accueil) | KeyHome — Immobilier en Afrique : Location, Vente, Terrain sans arnaque | ✅ Complète (270 chars — trop long) | ✅ | ⚠️ Description trop longue |
| `/search` | Rechercher un logement — Carte interactive & filtres avancés | ✅ Complète | ✅ | ✅ |
| `/ads/[id]/[slug]` | Dynamique via `generateMetadata()` | ✅ Dynamique | ✅ | ✅ |
| `/conditions` | ❓ Non vérifié | ❓ | ❓ | À vérifier |
| `/confidentialite` | ❓ Non vérifié | ❓ | ❓ | À vérifier |

**Comment vérifier** :
1. Screaming Frog → Page Titles / Meta Descriptions → Exporter le rapport
2. Google Search Console → Performance → Vérifier les CTR par page
3. `document.querySelector('meta[name="description"]')?.content` dans la console

**Recommandations** :
- **Raccourcir la meta description de l'accueil** : Maximum 155-160 caractères pour éviter la troncature dans les SERP
- Ajouter des meta descriptions uniques pour `/conditions` et `/confidentialite`
- Template des titles : maintenir le format `%s | KeyHome` (déjà configuré ✅)

### 1.13 🧩 Données structurées (Schema.org)

**Constat simulé** : ✅✅ Excellent — l'un des points les plus forts du site.

**Schémas implémentés dans `JsonLd.tsx`** :
1. ✅ **WebSite** avec `SearchAction` (sitelinks search box)
2. ✅ **Organization** (knowledge panel)
3. ✅ **RealEstateAgent** (niche schema)
4. ✅ **SoftwareApplication** avec `AggregateRating`
5. ✅ **FAQPage** (10 questions — potentiel rich snippets)
6. ✅ **HowTo** (4 étapes — rich snippet procédure)
7. ✅ **BreadcrumbList** (4 éléments)

**⚠️ ALERTE : `AggregateRating` potentiellement fictif** :
```json
"aggregateRating": {
  "ratingValue": "4.8",
  "reviewCount": "850",
  "ratingCount": "1200"
}
```
Si ces chiffres ne correspondent pas à de vrais avis vérifiables, Google pourrait appliquer une **action manuelle pour markup trompeur**.

**Comment vérifier** :
1. Google Rich Results Test : `https://search.google.com/test/rich-results?url=https://keyhome.app`
2. Schema.org Validator : `https://validator.schema.org/`
3. Google Search Console → Améliorations → Vérifier chaque type de rich result

**Recommandations** :
- **Retirer ou corriger `AggregateRating`** : Lier les données à de vrais avis depuis le backend, ou retirer complètement en attendant d'avoir des avis réels
- Ajouter **`RealEstateListing`** schema sur chaque page d'annonce (prix, images, localisation, surface)
- Ajouter **`Review`** schema quand le système d'avis est opérationnel
- Ajouter **`LocalBusiness`** pour chaque ville/pays desservi

### 1.14 🖼️ Optimisation des images

**Constat simulé** : ✅ Bonne configuration technique, mais des lacunes.

**Points positifs** :
- ✅ `next/image` avec formats AVIF/WebP (`next.config.ts` → `formats: ['image/avif', 'image/webp']`)
- ✅ Cache immutable pour `/images/*` (1 an)
- ✅ Remote patterns configurés pour les domaines keyhome

**Problèmes détectés** :
- ❌ Les images de la landing page sont chargées côté client (pas de SSR) → pas de `<img>` dans le HTML initial
- ⚠️ L'image `/images/og-cover.png` est référencée mais potentiellement absente
- ⚠️ Images dans `/public/images/` en formats mixtes (.webp, .jpg, .png) — les .jpg et .png pourraient être optimisés

**Comment vérifier** :
1. Lighthouse → Performance → « Properly size images » et « Serve images in next-gen formats »
2. `find ./public/images -type f -name "*.jpg" -o -name "*.png" | wc -l`
3. Chrome DevTools → Network → Img → Vérifier les tailles

**Recommandations** :
- Convertir `04Final.jpg` et `Maison Blanche.png` en WebP
- S'assurer que toutes les images ont des attributs `alt` descriptifs avec mots-clés
- Implémenter le lazy loading natif (`loading="lazy"`) sur les images below-the-fold (Next.js Image le fait automatiquement sauf pour `priority`)
- Créer `/public/images/og-cover.png` (1200×630px) pour le partage social

### 1.15 🔗 Stratégie de canonicalisation

**Constat simulé** : ✅ Correctement implémentée.

- `metadataBase: new URL('https://keyhome.app')` → ✅
- `alternates.canonical` défini sur les pages principales → ✅
- Pages d'annonces avec canonical dynamique → ✅

**Recommandations** :
- S'assurer que les futures pages de recherche avec paramètres de filtres utilisent une stratégie canonical cohérente
- Implémenter `rel="prev"` / `rel="next"` pour les listes paginées (si applicable)

---

## 2. RECHERCHE DE MOTS-CLÉS

### Instructions pour obtenir les données réelles

1. **Google Keyword Planner** : `https://ads.google.com/home/tools/keyword-planner/` (gratuit avec compte Google Ads)
2. **Ahrefs Keywords Explorer** : `https://ahrefs.com/keywords-explorer` → Sélectionner « Google Cameroun/Côte d'Ivoire/Bénin »
3. **SEMrush** : `https://www.semrush.com/analytics/keywordoverview/` → Base de données francophone
4. **Ubersuggest** : `https://neilpatel.com/ubersuggest/` (version gratuite limitée)
5. **Google Trends** : `https://trends.google.com/` → Comparer les tendances par pays africain

### 2.1 Mots-clés informationnels (7-10)

| # | Mot-clé | Volume estimé/mois | Difficulté | Position actuelle simulée | Page cible |
|---|---------|-------------------|------------|--------------------------|------------|
| 1 | comment trouver un logement au cameroun | 1 200 | Faible | Non classé | Blog (à créer) |
| 2 | éviter les arnaques immobilières afrique | 800 | Faible | Non classé | Blog (à créer) |
| 3 | prix loyer douala 2026 | 1 500 | Faible | Non classé | Page ville Douala (à créer) |
| 4 | comment louer un appartement abidjan | 900 | Moyen | Non classé | Blog (à créer) |
| 5 | quartiers résidentiels douala | 600 | Faible | Non classé | Guide quartiers (à créer) |
| 6 | démarches achat terrain au bénin | 500 | Faible | Non classé | Blog (à créer) |
| 7 | conseils location maison afrique | 700 | Faible | Non classé | Blog (à créer) |
| 8 | arnaque immobilière cameroun que faire | 450 | Faible | Non classé | Blog (à créer) |
| 9 | meilleurs sites immobiliers afrique | 1 100 | Moyen | Non classé | Page comparaison (à créer) |
| 10 | trouver logement étudiant cotonou | 350 | Faible | Non classé | Blog (à créer) |

### 2.2 Mots-clés commerciaux (7-10)

| # | Mot-clé | Volume estimé/mois | Difficulté | Position actuelle simulée | Page cible |
|---|---------|-------------------|------------|--------------------------|------------|
| 1 | meilleur site immobilier cameroun | 1 800 | Moyen | Non classé | Landing page (accueil) |
| 2 | comparatif sites immobiliers afrique | 600 | Moyen | Non classé | Page comparaison (à créer) |
| 3 | avis keyhome | 200 | Faible | Position ~5 | Accueil / Page avis |
| 4 | agence immobilière en ligne douala | 900 | Moyen | Non classé | Page ville Douala |
| 5 | application recherche logement afrique | 500 | Faible | Non classé | Accueil |
| 6 | plateforme immobilière abidjan | 700 | Moyen | Non classé | Page ville Abidjan |
| 7 | keyhome vs coinafrique | 100 | Faible | Non classé | Page comparaison (à créer) |
| 8 | location meublée douala prix | 1 200 | Moyen | Non classé | Search / Page ville |
| 9 | site annonces immobilières cotonou | 400 | Faible | Non classé | Page ville Cotonou |
| 10 | immobilier lomé togo avis | 300 | Faible | Non classé | Page ville Lomé |

### 2.3 Mots-clés transactionnels (10)

| # | Mot-clé | Volume estimé/mois | Difficulté | Position actuelle simulée | Page cible |
|---|---------|-------------------|------------|--------------------------|------------|
| 1 | appartement à louer douala | 3 500 | Élevé | Non classé | Search filtré Douala |
| 2 | maison à vendre douala | 2 800 | Élevé | Non classé | Search filtré Douala |
| 3 | terrain à vendre cotonou | 1 500 | Moyen | Non classé | Search filtré Cotonou |
| 4 | location appartement abidjan | 4 200 | Élevé | Non classé | Search filtré Abidjan |
| 5 | villa à louer lomé | 800 | Moyen | Non classé | Search filtré Lomé |
| 6 | studio meublé douala akwa | 600 | Faible | Non classé | Search filtré |
| 7 | terrain à vendre yaoundé | 1 800 | Moyen | Non classé | Search filtré Yaoundé |
| 8 | appartement 2 chambres douala | 900 | Moyen | Non classé | Search filtré |
| 9 | maison à louer bafoussam | 500 | Faible | Non classé | Search filtré Bafoussam |
| 10 | location bureau accra ghana | 400 | Faible | Non classé | Search filtré Accra |

### 2.4 🎯 5 « Quick Wins » (faible difficulté, forte pertinence)

| # | Mot-clé | Volume | Rationale | Page cible |
|---|---------|--------|-----------|------------|
| 1 | **éviter arnaques immobilières cameroun** | 800 | Faible compétition, aligné parfaitement avec la proposition de valeur « sans arnaque » de KeyHome | Blog article dédié |
| 2 | **studio meublé douala akwa** | 600 | Long-tail ultra ciblé, très peu de concurrence, intent transactionnel fort | Page recherche (après dé-auth-gating) |
| 3 | **avis keyhome** | 200 | Mot-clé de marque, facile à dominer, construit la confiance | Page d'accueil + page témoignages |
| 4 | **prix loyer douala 2026** | 1 500 | Requête informative avec volume élevé, aucun concurrent africain ne publie de données fraîches | Blog / Page ville avec données agrégées |
| 5 | **application recherche logement afrique** | 500 | Différenciateur tech (app web/mobile), peu de concurrence sur ce segment | Landing page optimisée |

---

## 3. STRATÉGIE DE CONTENU

### 3.1 📄 Recommandations de création de pages

#### A. Pages de ville programmatiques (Priorité P0)

Créer des landing pages publiques pour chaque ville majeure :

| URL proposée | Ville | Contenu |
|-------------|-------|---------|
| `/immobilier/douala` | Douala | Nombre d'annonces, prix moyen par quartier, carte, top annonces, guide quartiers |
| `/immobilier/abidjan` | Abidjan | Idem |
| `/immobilier/cotonou` | Cotonou | Idem |
| `/immobilier/lome` | Lomé | Idem |
| `/immobilier/yaounde` | Yaoundé | Idem |
| `/immobilier/accra` | Accra | Version anglaise |
| `/immobilier/dakar` | Dakar | Idem |
| `/immobilier/bamako` | Bamako | Idem |

**Rationale** : Ces pages ciblent les mots-clés transactionnels les plus volumineux (« appartement à louer [ville] ») et créent des hubs SEO par localisation. Données dynamiques depuis l'API backend.

#### B. Pages de type de bien (Priorité P1)

| URL proposée | Type | Contenu |
|-------------|------|---------|
| `/appartements` | Appartement | Hub avec filtres, annonces récentes, guide location |
| `/maisons` | Maison | Hub avec filtres, annonces récentes |
| `/terrains` | Terrain | Hub avec filtres, guide achat terrain |
| `/villas` | Villa | Hub avec filtres, annonces récentes |

#### C. Pages de comparaison (Priorité P2)

| URL proposée | Sujet |
|-------------|-------|
| `/comparaison/keyhome-vs-coinafrique` | Comparaison directe avec le concurrent principal |
| `/comparaison/meilleurs-sites-immobiliers-afrique` | Guide comparatif des plateformes |

#### D. Section Blog (Priorité P1)

Créer `/blog` avec une architecture Next.js dédiée (MDX ou CMS headless).

### 3.2 📅 Calendrier de contenu (12 mois — 1 article/mois)

| Mois | Titre | Mot-clé cible | Outline (H2/H3) | Mots estimés | Intent |
|------|-------|--------------|------------------|-------------|--------|
| **M1** (Avr 2026) | Comment éviter les arnaques immobilières au Cameroun : Guide 2026 | éviter arnaques immobilières cameroun | • Les 7 types d'arnaques courantes • Comment reconnaître une fausse annonce • Pourquoi KeyHome vérifie chaque annonce • Checklist anti-arnaque à télécharger | 2 500 | Informationnel |
| **M2** (Mai 2026) | Prix des loyers à Douala en 2026 : quartier par quartier | prix loyer douala 2026 | • Méthodologie de collecte • Prix moyen par quartier (Akwa, Bonapriso, Deido, Bonamoussadi) • Évolution vs 2025 • Carte interactive des prix | 2 000 | Informationnel |
| **M3** (Juin 2026) | Location appartement à Abidjan : le guide complet du locataire | comment louer appartement abidjan | • Les quartiers les plus demandés • Budget à prévoir • Documents nécessaires • Erreurs à éviter • Trouver sur KeyHome | 2 200 | Informationnel / Commercial |
| **M4** (Juil 2026) | Acheter un terrain au Bénin : démarches, prix et pièges à éviter | démarches achat terrain bénin | • Cadre juridique foncier béninois • Prix moyen par zone • Procédure d'achat étape par étape • Documents et notaire • Trouver un terrain vérifié sur KeyHome | 2 500 | Informationnel |
| **M5** (Août 2026) | Top 10 des quartiers résidentiels de Douala pour familles | quartiers résidentiels douala | • Critères de sélection • Bonamoussadi, Bonapriso, Logpom… • Sécurité, écoles, commerces • Budget par quartier • Annonces disponibles | 2 000 | Informationnel / Commercial |
| **M6** (Sep 2026) | KeyHome vs CoinAfrique vs Expat-Dakar : quel site choisir en 2026 ? | comparatif sites immobiliers afrique | • Critères de comparaison • Tableau comparatif détaillé • Avantages/inconvénients • Verdict et recommandation | 2 000 | Commercial |
| **M7** (Oct 2026) | Guide du propriétaire : comment publier une annonce qui se loue vite | publier annonce immobilière afrique | • Rédiger un titre accrocheur • Prendre des photos qui vendent • Fixer le bon prix • Utiliser KeyHome pour maximiser la visibilité | 1 800 | Informationnel |
| **M8** (Nov 2026) | Trouver un logement étudiant à Cotonou : astuces et bons plans | logement étudiant cotonou | • Quartiers étudiants • Budget étudiant réaliste • Colocation vs studio • Périodes de recherche • Annonces étudiantes sur KeyHome | 1 800 | Informationnel |
| **M9** (Déc 2026) | Investir dans l'immobilier en Afrique de l'Ouest : guide 2027 | investir immobilier afrique ouest | • Marchés porteurs (Cameroun, CI, Bénin) • Rendement locatif moyen • Cadre fiscal • Risques et précautions • Trouver des biens d'investissement | 2 500 | Informationnel / Commercial |
| **M10** (Jan 2027) | Les 5 meilleures applications de recherche immobilière en Afrique | application recherche logement afrique | • Critères de sélection • Review de chaque app • Screenshots et UX • Pourquoi KeyHome est #1 | 2 000 | Commercial |
| **M11** (Fév 2027) | Déménager à Lomé : guide pratique pour les expatriés | déménager lomé togo | • Formalités administratives • Quartiers recommandés • Coût de la vie • Trouver un logement • Communauté expat | 2 200 | Informationnel |
| **M12** (Mar 2027) | Mobile Money et immobilier : la révolution du paiement sécurisé en Afrique | paiement mobile money immobilier | • État des lieux du mobile money en Afrique • Avantages pour l'immobilier • Comment KeyHome sécurise les transactions • Témoignages utilisateurs | 2 000 | Informationnel / Branding |

### 3.3 🔗 Stratégie de maillage interne

**Principes généraux** :
1. **Architecture en silo** : Chaque cluster thématique (ville, type de bien, guide) forme un silo avec des liens bidirectionnels
2. **Règle des 3 clics** : Toute page doit être accessible en maximum 3 clics depuis l'accueil
3. **Texte d'ancre descriptif** : Éviter « cliquez ici », privilégier « appartements à louer à Douala »
4. **Liens contextuels** : Intégrer les liens dans le corps du texte, pas seulement dans la navigation

**Hubs/Piliers recommandés** :

```
Accueil (/)
├── /immobilier/douala (hub ville)
│   ├── /search?city=douala (résultats)
│   ├── /blog/prix-loyers-douala-2026
│   ├── /blog/quartiers-residentiels-douala
│   └── /ads/[id]/[slug] (annonces individuelles)
├── /immobilier/abidjan (hub ville)
│   ├── /search?city=abidjan
│   ├── /blog/location-appartement-abidjan
│   └── /ads/[id]/[slug]
├── /appartements (hub type)
│   ├── /search?type=appartement
│   └── Liens vers articles blog pertinents
├── /blog (hub contenu)
│   ├── Articles informationnels → liens vers pages ville/search
│   └── Articles commerciaux → liens vers pages produit
└── /comparaison (hub comparaison)
    ├── /comparaison/keyhome-vs-coinafrique
    └── /comparaison/meilleurs-sites-immobiliers-afrique
```

**Intégration du nouveau contenu** :
- Chaque article de blog doit contenir 3-5 liens internes vers des pages de recherche ou de ville
- Les pages d'annonces doivent lier vers la page ville correspondante
- La landing page doit lier vers les 3-4 villes les plus populaires
- Ajouter un fil d'Ariane (breadcrumb) sur toutes les pages (le schema BreadcrumbList existe déjà)

---

## 4. CHECKLIST SEO ON-PAGE

### Page exemple : Page de recherche `/search` (après dé-auth-gating)

#### Optimisation hypothétique complète

**Meta Title** (58 caractères) :
```
Recherche immobilière Afrique — Carte & filtres | KeyHome
```

**Meta Description** (158 caractères) :
```
Trouvez votre logement parmi des milliers d'annonces vérifiées en Afrique. Carte interactive, filtres par ville et budget. Inscription gratuite. Essayez !
```

**Balise H1** :
```html
<h1>Trouvez votre logement idéal en Afrique</h1>
```

**Structure URL** :
```
https://keyhome.app/search
https://keyhome.app/search?city=douala&type=appartement
```

**Alt tags pour les images** :
- Image carte : `alt="Carte interactive des annonces immobilières en Afrique - KeyHome"`
- Image annonce 1 : `alt="Appartement 3 chambres à louer à Douala Bonamoussadi - 150 000 FCFA/mois"`
- Image annonce 2 : `alt="Terrain à vendre à Cotonou Fidjrossè - 25 000 000 FCFA"`

**Liens internes recommandés** :
- Depuis `/search` → `/immobilier/douala`, `/immobilier/abidjan` (liens "Voir toutes les annonces à [Ville]")
- Depuis `/search` → `/blog/eviter-arnaques-immobilieres-cameroun` (encart "Guide anti-arnaque")
- Depuis les pages de blog → `/search` (CTA "Rechercher maintenant")
- Depuis `/` (accueil) → `/search` (CTA principal)

**Schema markup recommandé** :
- `SearchAction` (déjà implémenté ✅)
- `ItemList` pour les résultats de recherche
- `BreadcrumbList` : Accueil > Recherche > [Ville] > [Type de bien]

### Checklist on-page générale

| Élément | Statut | Action |
|---------|--------|--------|
| Title tag unique et < 60 chars | ✅ (sur les pages configurées) | Ajouter pour les pages manquantes |
| Meta description unique et < 160 chars | ⚠️ Description accueil trop longue | Raccourcir à 155 chars |
| Balise H1 unique par page | ❌ Client-rendered sur landing | Migrer en SSR |
| Hiérarchie H1 > H2 > H3 | ⚠️ À vérifier | Audit des composants |
| URL propre et descriptive | ✅ `/ads/[id]/[slug]` | — |
| Images avec alt descriptifs | ⚠️ Non vérifiable (client-side) | Ajouter systématiquement |
| Liens internes contextuels | ❌ Très peu de maillage | Implémenter la stratégie §3.3 |
| Canonical tag | ✅ | — |
| Open Graph / Twitter Cards | ✅ | — |
| Schema.org JSON-LD | ✅✅ (7 schemas) | Ajouter RealEstateListing |
| Mobile responsive | ✅ | — |
| Temps de chargement < 3s | ⚠️ Mobile probablement > 3s | Optimiser (§1.5) |
| Contenu > 300 mots sur les pages clés | ❌ Landing page client-rendered | Migrer en SSR |

---

## 5. SEO OFF-PAGE

### 5.1 🔗 Opportunités de link building (7 tactiques)

| # | Tactique | Description | Difficulté | Impact estimé |
|---|----------|-------------|------------|--------------|
| 1 | **Annuaires immobiliers africains** | Soumettre KeyHome aux annuaires de référence : AfricanBizDirectory, GoAfricaOnline, PagesJaunes Afrique | Faible | Moyen |
| 2 | **Guest posts sur blogs tech africains** | Rédiger des articles invités pour TechCabal, Jeune Afrique Digital, CIO Mag Afrique, sur le thème "PropTech en Afrique" | Moyen | Élevé |
| 3 | **Partenariats universités** | Collaborer avec les universités de Douala, Abidjan, Cotonou pour un programme "Logement étudiant" → backlinks .edu | Moyen | Élevé |
| 4 | **Relations presse locales** | Communiqués de presse dans Cameroon Tribune, Fraternité Matin (CI), La Nouvelle Tribune (Bénin) lors de lancements dans nouvelles villes | Moyen | Élevé |
| 5 | **Répertoires d'apps** | Soumettre à Product Hunt, AlternativeTo, Capterra (catégorie Real Estate) | Faible | Moyen |
| 6 | **Infographies partageables** | Créer « Baromètre des loyers en Afrique 2026 » — contenu visuel partageable = backlinks naturels | Moyen | Élevé |
| 7 | **Témoignages et études de cas** | Collecter des témoignages d'utilisateurs qui ont trouvé leur logement → contenu partageable sur réseaux et blogs | Faible | Moyen |

**Sujets de guest posts recommandés** :
- "Comment la PropTech transforme l'immobilier en Afrique francophone"
- "Mobile Money : le game changer de l'immobilier digital africain"
- "Pourquoi la vérification des annonces est cruciale sur le marché immobilier africain"

### 5.2 📍 SEO Local

**Checklist Google Business Profile** :

| Étape | Action |
|-------|--------|
| 1 | Créer un profil Google Business pour chaque pays : "KeyHome Cameroun", "KeyHome Côte d'Ivoire", etc. |
| 2 | Catégorie : "Service immobilier en ligne" / "Agence immobilière" |
| 3 | Description : Reprendre le texte optimisé de l'Organization schema |
| 4 | Photos : Screenshots de l'app, logo, images de propriétés |
| 5 | Horaires : 24/7 (service en ligne) |
| 6 | Lien website : `https://keyhome.app/immobilier/[ville]` |
| 7 | Solliciter des avis Google des utilisateurs satisfaits |
| 8 | Publier des posts Google Business hebdomadaires (nouvelles annonces, stats marché) |

**Annuaires et citations locaux** :
- GoAfricaOnline (pan-africain)
- PagesJaunes Cameroun / Côte d'Ivoire / Bénin
- Yelp (pour les villes avec présence)
- TripAdvisor (pour les locations de vacances)
- Facebook Places / Pages locales
- Annuaires des Chambres de Commerce locales

### 5.3 📱 Signaux sociaux

**Impact indirect sur le SEO** :
Les partages sociaux n'influencent pas directement le classement Google, mais ils :
- Augmentent la visibilité du contenu → plus de backlinks naturels
- Génèrent du trafic direct → signaux d'engagement positifs
- Construisent la notoriété de marque → augmentation des recherches de marque

**Stratégies recommandées** :

| Plateforme | Stratégie |
|-----------|-----------|
| **Facebook** | Rejoindre/créer des groupes immobiliers par ville (ex: "Immobilier Douala", "Location Abidjan"). Partager les nouvelles annonces avec aperçu visuel. Budget pub : ciblage par ville africaine. |
| **WhatsApp** | Créer des groupes "Alertes Immobilières [Ville]" — canal de distribution directe. Statuts WhatsApp Business avec annonces vedettes. |
| **Twitter/X** | Compte @keyhome_app (déjà référencé). Tweeter les statistiques marché, les nouvelles annonces, les articles de blog. Utiliser les hashtags #ImmobilierAfrique #PropTech. |
| **Instagram** | Photos de propriétés de qualité, stories "visite virtuelle", reels "avant/après", témoignages utilisateurs. |
| **LinkedIn** | Articles thought leadership sur la PropTech en Afrique, actualités de l'entreprise, recrutement. Cibler les investisseurs et professionnels de la diaspora. |
| **TikTok** | Vidéos courtes "visite d'appartement à Douala", "comment éviter les arnaques", format très viral en Afrique. |

---

## 6. MESURE ET SUIVI

### 6.1 📊 Configuration Google Search Console

**Étapes** :
1. Aller sur `https://search.google.com/search-console/`
2. Cliquer « Ajouter une propriété »
3. Choisir « Domaine » → Entrer `keyhome.app`
4. Vérification DNS : Ajouter l'enregistrement TXT fourni chez votre registrar (Vercel DNS ou autre)
5. Alternative : Propriété URL → `https://keyhome.app` → Vérification par balise HTML dans `<head>` :
   ```html
   <meta name="google-site-verification" content="VOTRE_CODE" />
   ```
   → Ajouter dans `src/app/layout.tsx` via l'objet `metadata.verification`
6. Soumettre le sitemap : `https://keyhome.app/sitemap.xml`
7. Demander l'indexation des pages critiques

**Rapports clés à monitorer** :

| Rapport | Fréquence | Quoi surveiller |
|---------|-----------|----------------|
| **Performance** | Hebdomadaire | Impressions, clics, CTR, position moyenne par requête et par page |
| **Couverture / Indexation** | Hebdomadaire | Pages indexées vs soumises, erreurs de crawl, pages exclues |
| **Core Web Vitals** | Mensuel | LCP, INP, CLS — mobile et desktop séparément |
| **Améliorations** | Mensuel | Rich results (FAQ, HowTo), erreurs de schema |
| **Liens** | Mensuel | Liens entrants, liens internes, domaines référents |
| **Sitemaps** | Après chaque mise à jour | Statut de traitement, URLs découvertes vs indexées |

### 6.2 📈 Configuration Google Analytics 4 (GA4)

**Étapes** :
1. Aller sur `https://analytics.google.com/` → Créer un compte
2. Créer une propriété « KeyHome — Production »
3. Configurer un flux de données Web → `https://keyhome.app`
4. Récupérer le Measurement ID (`G-XXXXXXXXXX`)
5. Installer dans Next.js :

```typescript
// Option 1 : Via next/script dans layout.tsx
import Script from 'next/script';

// Dans le <head> :
<Script src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`} strategy="afterInteractive" />
<Script id="ga4" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');`}
</Script>

// Option 2 : Via @next/third-parties (recommandé)
import { GoogleAnalytics } from '@next/third-parties/google';
// Dans le body : <GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

> **Note** : Le site utilise déjà Vercel Analytics (`@vercel/analytics`). GA4 est complémentaire et offre des rapports SEO plus détaillés.

6. Configurer les **conversions** :
   - Événement « Déblocage contact » (paiement réussi)
   - Événement « Inscription » (création de compte)
   - Événement « Recherche » (utilisation du moteur de recherche)
   - Événement « Ajout favori »

7. **Lier GSC à GA4** :
   - GA4 → Admin → Product Links → Search Console Linking

**Rapports et explorations à configurer** :

| Rapport | Configuration |
|---------|-------------|
| Trafic organique | Acquisition → Traffic Acquisition → Filtrer « Organic Search » |
| Pages de destination | Engagement → Landing Pages → Filtrer source organique |
| Conversions organiques | Explorations → Funnel : Landing organique → Inscription → Déblocage contact |
| Comportement de recherche | Événements personnalisés → Paramètres : query, city, property_type |

### 6.3 📋 Métriques SEO à suivre (hebdomadaire)

| # | Métrique | Source | Pourquoi | Objectif M6 |
|---|---------|--------|----------|------------|
| 1 | **Trafic organique** | GA4 + GSC | Indicateur principal de la croissance SEO | +300% vs actuel |
| 2 | **Pages indexées** | GSC Indexation | Mesure la couverture du crawl | 500+ pages |
| 3 | **Impressions dans les SERP** | GSC Performance | Mesure la visibilité avant le clic | 50 000/mois |
| 4 | **CTR moyen** | GSC Performance | Qualité des titles/descriptions | > 5% |
| 5 | **Position moyenne (mots-clés cibles)** | GSC / Ahrefs | Progression du classement | Top 10 pour 5 keywords |
| 6 | **Core Web Vitals (mobile)** | GSC / PageSpeed Insights | Performance technique impactant le classement | LCP < 2.5s, CLS < 0.1 |
| 7 | **Taux de conversion organique** | GA4 | Inscription + déblocage contact depuis trafic organique | > 3% |

### 6.4 💰 Mesurer le ROI des efforts SEO

**Méthodologie de calcul** :

#### Étape 1 : Calculer la valeur du trafic organique
```
Valeur trafic = Nombre de visiteurs organiques × CPC moyen équivalent

Exemple :
- 10 000 visiteurs organiques/mois
- CPC moyen Google Ads pour "appartement à louer douala" ≈ 0,15 €
- Valeur = 10 000 × 0,15 € = 1 500 €/mois d'économie publicitaire
```

#### Étape 2 : Calculer le revenu attribuable au SEO
```
Revenu SEO = Visiteurs organiques × Taux de conversion × Valeur moyenne d'une conversion

Exemple :
- 10 000 visiteurs organiques
- 2% taux de conversion (inscription)
- 15% des inscrits débloquent un contact (500 FCFA minimum)
- Revenu = 10 000 × 2% × 15% × 500 FCFA = 150 000 FCFA/mois (~230 €)
```

#### Étape 3 : Calculer le ROI
```
ROI SEO = (Revenus attribuables au SEO + Valeur économisée en ads - Coût SEO) / Coût SEO × 100

Coûts SEO à inclure :
- Temps développeur (refactoring SSR, sitemap, pages ville)
- Rédaction de contenu (blog, pages ville)
- Outils (Ahrefs/SEMrush : ~100 €/mois)
- Éventuel consultant SEO externe

Exemple sur 6 mois :
- Revenus cumulés : 1 380 € + 9 000 € (économie ads)
- Coûts : 3 000 € (dev) + 1 200 € (contenu) + 600 € (outils)
- ROI = (10 380 - 4 800) / 4 800 × 100 = 116%
```

#### Outils de suivi du ROI :
- **GA4 Attribution** : Modèle data-driven pour attribuer les conversions
- **Tableau de bord custom** : Google Looker Studio connecté à GA4 + GSC
- **Rapport mensuel** : Comparer la progression mois par mois

---

## RÉSUMÉ DES PRIORITÉS

### 🔴 Priorité 0 (Critique — À faire immédiatement)

| # | Action | Impact SEO | Effort |
|---|--------|-----------|--------|
| 1 | **Refactoriser `page.tsx`** : migrer la landing page en Server Component | ★★★★★ | 2-3 jours dev |
| 2 | **Sortir `/ads/[id]/[slug]` du layout auth-gated** | ★★★★★ | 1-2 jours dev |
| 3 | **Rendre `/search` publiquement accessible** (au moins en lecture) | ★★★★★ | 2-3 jours dev |
| 4 | **Retirer/corriger `AggregateRating` fictif** dans JsonLd.tsx | ★★★★☆ | 30 minutes |

### 🟡 Priorité 1 (Important — Dans les 30 jours)

| # | Action | Impact SEO | Effort |
|---|--------|-----------|--------|
| 5 | **Implémenter le sitemap dynamique** avec les pages d'annonces | ★★★★☆ | 1 jour dev |
| 6 | **Créer les pages de ville programmatiques** (`/immobilier/[ville]`) | ★★★★☆ | 3-5 jours dev |
| 7 | **Configurer Google Search Console + GA4** | ★★★★☆ | 2 heures |
| 8 | **Optimiser les Core Web Vitals mobile** (Three.js, bundle MUI) | ★★★☆☆ | 2-3 jours dev |
| 9 | **Créer `/public/images/og-cover.png`** pour le partage social | ★★★☆☆ | 1 heure design |

### 🟢 Priorité 2 (Croissance — Dans les 90 jours)

| # | Action | Impact SEO | Effort |
|---|--------|-----------|--------|
| 10 | **Lancer le blog** avec les 3 premiers articles | ★★★☆☆ | 2 semaines |
| 11 | **Ajouter le schema `RealEstateListing`** sur les pages d'annonces | ★★★☆☆ | 1 jour dev |
| 12 | **Implémenter le maillage interne** selon la stratégie §3.3 | ★★★☆☆ | 1 semaine |
| 13 | **Créer les profils Google Business** par pays | ★★☆☆☆ | 1 jour |
| 14 | **Ajouter le support `hreflang` pour l'anglais** (Ghana, international) | ★★☆☆☆ | 1 jour dev |
| 15 | **Lancer la stratégie de link building** (guest posts, annuaires) | ★★☆☆☆ | Continu |

---

> **Note importante** : Toutes les métriques de volume de recherche, de difficulté de mots-clés et de classement dans ce rapport sont des **estimations simulées**. Utilisez les outils mentionnés (Ahrefs, SEMrush, Google Keyword Planner, Google Search Console) pour obtenir les données réelles et ajuster la stratégie en conséquence.

---

*Rapport généré le 1er mars 2026 — KeyHome SEO Audit v1.0*

