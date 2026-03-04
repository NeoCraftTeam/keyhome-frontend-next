# Rapport d'Analyse Stratégique et Plan de Développement pour KeyHome

**Date :** 04 Mars 2026
**Auteur :** Manus AI

## Introduction

Ce document présente une analyse complète de l'application front-end KeyHome, conformément à votre demande. L'objectif est de fournir une feuille de route actionnable pour transformer l'application en un produit leader sur le marché immobilier, en se concentrant sur la robustesse technique, la stratégie commerciale, l'expérience utilisateur et l'esthétique.

Le rapport est structuré en plusieurs sections clés, chacune abordant un aspect critique de l'application :

1.  **Diagnostic des Vulnérabilités et Bugs :** Une analyse statique approfondie du code pour identifier les problèmes de sécurité, de performance et de fonctionnalité.
2.  **Audit de la Charte Graphique et du Design Responsive :** Une évaluation de la cohérence visuelle et de l'adaptabilité de l'interface sur tous les appareils.
3.  **Stratégie Commerciale et Esthétique :** Des recommandations pour faire évoluer le modèle économique, enrichir les fonctionnalités et raffiner l'identité visuelle de l'application.
4.  **Plan d'Implémentation du Module de Sondage :** Des guides détaillés pour le développement front-end et back-end d'une nouvelle fonctionnalité de sondage utilisateur.

Chaque section contient des observations précises et des recommandations concrètes pour guider les prochaines étapes de développement.

---



---

# Diagnostic des Vulnérabilités et Bugs

Suite à une analyse statique approfondie du code source, voici une liste structurée des problèmes identifiés, classés par ordre de sévérité. Chaque point inclut des étapes de reproduction (si applicable) et des stratégies de remédiation concrètes pour améliorer la robustesse, la sécurité et la performance de l'application.

## 1.1. Vulnérabilités Critiques

| ID | Vulnérabilité | Fichiers Affectés | Description et Risque | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **C-01** | **Cross-Site Scripting (XSS) Potentiel via `setHTML`** | `src/app/(dashboard)/nearby/page.tsx`<br>`src/app/(dashboard)/search/page.tsx` | Les popups des marqueurs sur la carte sont construits via la concaténation de chaînes HTML et injectés avec `setHTML`. Bien que le titre de l'annonce soit échappé (`escapeHtml(ad.title)`), d'autres variables comme `ad.id` et `ad.slug` sont injectées directement dans un attribut `onclick`. Si ces valeurs pouvaient être manipulées pour contenir des caractères malveillants, cela pourrait conduire à une exécution de script. | **Ne jamais construire du HTML avec des chaînes de caractères.** Remplacer l'injection `setHTML` par une approche programmatique sécurisée. Créer un élément `div` avec `document.createElement`, y attacher des écouteurs d'événements (`addEventListener`) pour la navigation, et utiliser `textContent` pour insérer les données. Enfin, passer cet élément DOM au constructeur `Popup`. |

## 1.2. Bugs à Haute Sévérité

| ID | Bug | Fichiers Affectés | Description et Impact | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **H-01** | **Navigation Côté Client Brisée** | `src/app/(dashboard)/ads/[id]/[slug]/page.tsx` | L'utilisation de `window.location.href = response.payment_url;` pour la redirection vers le paiement force un rechargement complet de la page. Cela brise le modèle d'Application Page Unique (SPA) de Next.js, entraînant une expérience utilisateur saccadée et une perte de l'état côté client. | Remplacer toutes les instances de `window.location.href` par le `router.push()` ou `router.replace()` du hook `useRouter` de `next/navigation` pour les navigations internes, et uniquement pour les URL externes conserver `window.location.href`. |
| **H-02** | **Fuite de Mémoire Potentielle sur la Carte** | `src/app/(dashboard)/nearby/page.tsx` | Sur la page "À proximité", le marqueur de la position de l'utilisateur est ajouté à la carte mais n'est jamais retiré lorsque le composant est démonté. Chaque fois que l'utilisateur reviendra sur cette page, un nouveau marqueur sera ajouté par-dessus l'ancien, créant une fuite de mémoire et des problèmes visuels. | Dans le `useEffect` qui initialise la carte, stocker le marqueur de position dans une `useRef`. Dans la fonction de nettoyage du `useEffect`, appeler la méthode `remove()` sur ce marqueur pour le supprimer proprement de la carte. |
| **H-03** | **Conflit de Stockage Local pour le Thème** | `src/components/landing/LandingThemeContext.tsx`<br>`src/providers/ThemeProvider.tsx` | Deux systèmes de gestion de thème coexistent et utilisent des clés différentes dans le `localStorage` : `'keyhome-theme'` pour la landing page et `'theme'` pour le reste de l'application. Cela crée une incohérence : le changement de thème dans une section ne se reflète pas dans l'autre. | Unifier la gestion du thème. Supprimer `LandingThemeContext.tsx` et envelopper toute l'application (dans `layout.tsx`) avec un seul `ThemeProvider`. Utiliser une clé unique (`'keyhome-theme'`) pour le `localStorage` à travers toute l'application. |

## 1.3. Bugs à Sévérité Moyenne

| ID | Bug | Fichiers Affectés | Description et Impact | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **M-01** | **Image de Remplacement Manquante** | `src/components/ads/AdCard.tsx` | Le composant `AdCard` utilise `'/placeholder-house.jpg'` comme image par défaut si une annonce n'a pas d'images. Ce fichier n'existe pas dans le dossier `/public`, ce qui cause une erreur 404 et une icône d'image cassée, dégradant l'expérience visuelle. | Créer une image de remplacement générique (par exemple, un logo de maison stylisé) et la placer dans `/public/images/placeholder-house.jpg`. S'assurer que toutes les images de fallback existent. |
| **M-02** | **Manque de Code Splitting pour les Librairies Lourdes** | `src/components/landing/ThreeCanvas.tsx`<br>`src/app/(dashboard)/nearby/page.tsx` | Des librairies lourdes comme `three.js` et `mapbox-gl` sont importées statiquement. Cela augmente la taille du bundle JavaScript initial, même pour les utilisateurs qui ne visitent pas les pages qui les utilisent, ralentissant le premier chargement. | Utiliser l'importation dynamique de Next.js. Pour `ThreeCanvas`, l'exporter avec `export default dynamic(() => import('@/components/landing/ThreeCanvas'), { ssr: false });`. Pour les cartes, encapsuler les composants Mapbox dans un composant qui est lui-même importé dynamiquement. |
| **M-03** | **Problèmes d'Accessibilité (a11y)** | `src/components/landing/LandingNav.tsx` (et autres) | Des éléments `div` et `a` ont des gestionnaires d'événements `onClick` sans avoir les attributs ARIA appropriés comme `role="button"` ou un `tabIndex="0"`. Cela rend ces éléments non navigables ou non identifiables pour les utilisateurs de lecteurs d'écran ou de navigation au clavier. | Pour tout élément non-bouton rendu cliquable, ajouter `role="button"` et `tabIndex="0"`. Ajouter également un gestionnaire `onKeyDown` qui déclenche le `onClick` lorsque la touche "Entrée" ou "Espace" est pressée pour une accessibilité complète au clavier. |
| **M-04** | **Duplication de Code Utilitair**e | `src/app/(auth)/register/page.tsx`<br>`src/app/(dashboard)/profile/page.tsx` | La fonction `getPasswordStrength` est définie identiquement dans deux fichiers distincts. Cela viole le principe DRY (Don't Repeat Yourself) et rend la maintenance plus complexe. | Déplacer la fonction `getPasswordStrength` dans un fichier utilitaire partagé, par exemple `src/lib/utils.ts`, et l'importer dans les deux composants. |

## 1.4. Problèmes à Faible Sévérité

| ID | Problème | Fichier Affecté | Description | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **L-01** | **Syntaxe JavaScript Superflue** | `src/app/(dashboard)/ads/[id]/[slug]/page.tsx` | Une ligne contient un double point-virgule (`;;`). Bien que cela ne casse pas l'exécution, c'est une erreur de syntaxe qui devrait être corrigée pour la propreté du code. | Supprimer le point-virgule en trop. Utiliser un linter comme ESLint pour détecter et corriger automatiquement ces problèmes. |
| **L-02** | **Dépendances Inutilisées** | `src/app/(dashboard)/profile/page.tsx` | Le fichier importe plusieurs icônes (`LockOpenIcon`, `Apple`, `Facebook`, `Google`) et des services (`usersService`) qui ne sont pas utilisés dans le composant, alourdissant inutilement le code. | Supprimer toutes les importations qui ne sont pas activement utilisées. Des outils comme l'extension ESLint peuvent surligner et même supprimer automatiquement les importations inutilisées. |
| **L-03** | **Manque de Navigation au Clavier pour la Lightbox** | `src/app/(dashboard)/ads/[id]/[slug]/page.tsx` | La lightbox pour les images ne peut être contrôlée qu'à la souris (clic sur les flèches). Les utilisateurs naviguant au clavier ne peuvent pas changer d'image ou fermer la modale facilement. | Ajouter des écouteurs d'événements `onKeyDown` au niveau de la `Dialog` de la lightbox. Gérer les touches fléchées (`ArrowLeft`, `ArrowRight`) pour changer d'image et la touche `Escape` pour fermer la lightbox. |

---


# Audit de la Charte Graphique et du Design Responsive

Cette section évalue la cohérence visuelle de l'application (charte graphique) et son comportement sur différentes tailles d'écran (responsive design). L'objectif est d'identifier les incohérences et de fournir des recommandations pour créer une expérience utilisateur professionnelle, unifiée et fluide sur tous les appareils.

## 2.1. Audit de la Charte Graphique

L'application utilise Material-UI (MUI) avec un système de thème (clair/sombre), ce qui est une excellente base. Cependant, l'audit révèle de nombreuses incohérences qui fragmentent l'identité visuelle.

| ID | Incohérence | Fichiers Affectés | Description et Impact | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **G-01** | **Utilisation massive de couleurs hardcodées** | (Nombreux, ex: `src/components/reviews/ReviewForm.tsx`, `src/app/(dashboard)/ads/[id]/[slug]/page.tsx`) | Plus de 150 instances de couleurs (`#F6475F`, `#fff`, etc.) sont directement écrites dans les styles (attribut `sx` ou `style`). Cela contourne le système de thème MUI. **Impact :** 1) La maintenance est un cauchemar (changer une couleur nécessite de modifier des dizaines de fichiers). 2) Le mode sombre est incomplet ou cassé dans de nombreux composants. 3) L'identité visuelle est incohérente. | **Centraliser toutes les couleurs dans le thème.** Remplacer les valeurs hardcodées par les alias du thème MUI. Par exemple, au lieu de `color: '#F6475F'`, utiliser `color: 'primary.main'`. Pour les couleurs de texte, utiliser `text.primary`, `text.secondary`. Pour les fonds, `background.default`, `background.paper`. |
| **G-02** | **Styles en ligne vs. `sx` prop** | `src/components/landing/HeroSection.tsx` (et autres pages landing) | Les composants de la landing page utilisent majoritairement des styles en ligne (`style={{...}}`) au lieu de la prop `sx` de MUI. **Impact :** Les styles en ligne ne peuvent pas accéder aux valeurs du thème (breakpoints, spacing, couleurs) et sont moins performants. Cela crée une déconnexion stylistique entre la landing page et le reste de l'application. | Migrer tous les styles en ligne vers la prop `sx`. Cela permettra d'utiliser les tokens du thème (ex: `sx={{ color: 'primary.main', p: { xs: 2, md: 4 } }}`) et d'assurer une cohérence globale. |
| **G-03** | **Incohérences de `border-radius`** | `src/theme/theme.ts`, `src/components/layout/Navbar.tsx` | Le thème de base définit un `borderRadius` de 12px. Cependant, les `Button` ont un `borderRadius` de 8px, les `TextField` de 8px, et la barre de recherche dans la `Navbar` a un `borderRadius` de 40px. **Impact :** Ces variations créent une dissonance visuelle. Les coins des éléments ne suivent pas une règle unifiée. | **Standardiser le `borderRadius`.** Définir une échelle dans le thème (ex: `theme.shape.borderRadiusSmall: 8`, `theme.shape.borderRadius: 12`, `theme.shape.borderRadiusLarge: 16`). Utiliser ces variables pour tous les composants. La barre de recherche peut être une exception stylistique, mais les autres éléments devraient être cohérents. |
| **G-04** | **Gestion du Thème Landing vs. App** | `LandingThemeContext.tsx` vs `ThemeProvider.tsx` | Comme mentionné dans le rapport de bugs (H-03), il existe deux systèmes de thème. `LandingThemeContext` est une réimplémentation partielle de `ThemeProvider`, ce qui est redondant et source de conflits. | Supprimer `LandingThemeContext.tsx` et son provider. Envelopper l'intégralité de l'application dans le `ThemeProvider` principal (dans `src/app/layout.tsx`) pour que la landing page et le dashboard partagent le même contexte de thème et le même `localStorage`. |

## 2.2. Audit du Design Responsive

L'application utilise une approche responsive avec les breakpoints de MUI et `useMediaQuery`. L'implémentation est fonctionnelle mais présente des lacunes qui affectent l'expérience sur mobile.

| ID | Problème | Fichiers Affectés | Description et Impact | Recommandation |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Définition de `isMobile` incohérente** | `home/page.tsx` vs `nearby/page.tsx` | Sur la page d'accueil, `isMobile` est défini par `theme.breakpoints.down('sm')` (<600px), tandis que sur la page de recherche et "À proximité", il est défini par `theme.breakpoints.down('md')` (<900px). **Impact :** Le layout de l'application change de manière imprévisible à différents breakpoints, créant une expérience utilisateur déroutante sur tablette. | **Créer un hook `useResponsive` standardisé.** Ce hook retournerait des booléens clairs comme `isMobile`, `isTablet`, `isDesktop` basés sur des breakpoints unifiés (`sm`, `md`, `lg`). Utiliser ce hook dans tous les composants pour garantir un comportement responsive cohérent. |
| **R-02** | **Layout mobile peu optimisé sur la page de recherche** | `src/app/(dashboard)/search/page.tsx` | Sur mobile, les filtres sont dans un `Drawer` (tiroir) qui s'ouvre par-dessus la liste. Cependant, la gestion de l'état et l'application des filtres peuvent être améliorées pour éviter les re-renderings inutiles et les fermetures de tiroir inattendues. | 1. **Gestion d'état local :** Mettre à jour l'état des filtres localement dans le `Drawer` sans déclencher de recherche à chaque changement. 2. **Bouton "Appliquer" :** Ajouter un bouton "Appliquer les filtres" en bas du `Drawer`. La recherche n'est déclenchée que lorsque l'utilisateur clique sur ce bouton. Cela améliore considérablement les performances et l'utilisabilité. |
| **R-03** | **Grilles non optimisées pour petits écrans** | `src/app/(dashboard)/home/page.tsx` | La grille d'annonces utilise `xs: 6`, ce qui signifie deux colonnes sur les plus petits écrans. Sur un téléphone en mode portrait, cela rend les cartes d'annonces (`AdCard`) très petites et difficiles à lire/toucher. | Modifier la configuration de la grille pour passer à une seule colonne sur les très petits écrans. Par exemple : `size={{ xs: 12, sm: 6, md: 4, lg: 3 }}`. Une carte par ligne sur mobile est une pratique standard qui améliore la lisibilité. |
| **R-04** | **CSS personnalisé fragile pour la Landing Page** | `src/app/globals.css` | La landing page utilise des classes CSS personnalisées avec des requêtes `@media` manuelles. **Impact :** Cette approche est moins maintenable que l'utilisation des systèmes de layout de MUI (Grid, Stack, Box) et peut entrer en conflit avec le CSS-in-JS de MUI ou le futur Tailwind CSS. | **Refactoriser le CSS de la landing page.** Remplacer les classes CSS personnalisées et les `@media` queries par des composants `Box`, `Grid`, et `Stack` de MUI avec la prop `sx` pour gérer le responsive. Par exemple, au lieu d'une classe pour cacher un élément sur mobile, utiliser `sx={{ display: { xs: 'none', md: 'flex' } }}`. |

---


# Stratégie Commerciale, Fonctionnalités Clés et Améliorations Esthétiques

Pour transformer KeyHome en une application leader du marché ("million-dollar app"), il est crucial d'adopter une stratégie commerciale robuste, d'enrichir ses fonctionnalités de base et de raffiner son esthétique pour inspirer confiance et professionnalisme. Ce document présente une analyse et des recommandations sur ces trois piliers.

## 3.1. Modèle Économique et Stratégies de Conversion

L'application repose actuellement sur un modèle de micro-paiement pour débloquer les contacts des annonceurs. C'est une excellente base qui filtre les curieux et garantit des leads de qualité aux vendeurs. Pour passer à l'échelle supérieure, voici une proposition de modèle multi-facettes.

| Stratégie | Description | Impact Attendu | Considérations d'Implémentation |
| :--- | :--- | :--- | :--- |
| **1. Abonnements "Premium"** | Introduire des forfaits mensuels/annuels pour les chercheurs de biens. <br>- **Tier 1 (Chercheur Actif):** 5-10 déblocages par mois pour un prix fixe. <br>- **Tier 2 (Chercheur Intensif):** Déblocages illimités, accès aux alertes en temps réel. | - **Revenus récurrents et prévisibles.** <br>- Augmentation de la valeur vie client (LTV). <br>- Fidélisation des utilisateurs actifs. | - Le type de paiement `SUBSCRIPTION` existe déjà dans l'enum `PaymentType`. <br>- Nécessite une logique backend pour gérer les droits d'accès basés sur l'abonnement et le suivi des quotas. |
| **2. Monétisation des Annonceurs (Agents/Propriétaires)** | Offrir des options payantes pour augmenter la visibilité des annonces. <br>- **"Boost" d'Annonce:** Payer pour remonter une annonce en tête des résultats de recherche pendant une période définie (ex: 7 jours). <br>- **Annonce "À la Une":** Mettre en avant une annonce sur la page d'accueil. | - **Nouvelle source de revenus majeure.** <br>- Incitation pour les agents immobiliers à utiliser la plateforme de manière professionnelle. | - Le type `BOOST` existe déjà dans l'enum `PaymentType`. <br>- Le backend doit pouvoir trier les annonces en fonction de leur statut "boosté" ou "à la une". <br>- L'UI du dashboard vendeur doit intégrer ces options. |
| **3. Vérification d'Identité Payante** | Proposer un badge "Vérifié" aux annonceurs qui complètent un processus de vérification d'identité (ex: soumission de pièce d'identité). Ce service pourrait être payant ou inclus dans un abonnement "Agent Pro". | - **Augmentation drastique de la confiance** pour les acheteurs/locataires. <br>- Justifie un prix plus élevé pour les annonces vérifiées. <br>- Réduit la fraude et les fausses annonces. | - Intégration avec un service tiers de vérification d'identité (KYC). <br>- Le modèle `User` doit avoir un champ `is_verified`. <br>- Le badge doit être visible sur les `AdCard` et la page de détail. |

## 3.2. Amélioration des Fonctionnalités Clés

Pour se différencier, KeyHome doit offrir des fonctionnalités qui simplifient radicalement la recherche immobilière.

| Fonctionnalité | Description | Impact sur l'Utilisateur | Recommandation d'Implémentation |
| :--- | :--- | :--- | :--- |
| **1. Alertes et Recherches Sauvegardées** | Permettre aux utilisateurs de sauvegarder leurs filtres de recherche (ville, prix, nombre de chambres, etc.) et de recevoir une notification (email ou push) dès qu'une nouvelle annonce correspondant à leurs critères est publiée. | - **Engagement massif.** L'utilisateur n'a plus besoin de revenir manuellement sur l'app. <br>- Sentiment d'un service personnalisé et proactif. | - Créer une table `saved_searches` en base de données liée aux utilisateurs. <br>- Un `cron job` (tâche planifiée) côté backend compare les nouvelles annonces avec les recherches sauvegardées et envoie les notifications. |
| **2. Profils Publics pour Agents** | Permettre aux agents immobiliers et aux agences d'avoir une page de profil public listant toutes leurs annonces actives, leurs avis, et leur badge "Vérifié". | - **Crée une marketplace B2C/C2C.** <br>- Renforce la marque personnelle des agents et la confiance des utilisateurs. | - Le modèle `Agency` existe déjà. Il faut l'étendre et créer une page dédiée ` /agences/[slug]`. <br>- La page profil de l'utilisateur doit permettre de gérer ce profil public. |
| **3. Outils d'Aide à la Décision** | Intégrer des outils simples directement sur la page de l'annonce. <br>- **Calculateur de prêt immobilier :** Estimer les mensualités en fonction du prix, de l'apport et du taux. <br>- **Comparateur de biens :** Permettre de sélectionner plusieurs annonces et de les afficher côte à côte dans un tableau comparatif. | - **Augmente le temps passé sur le site.** <br>- Positionne KeyHome comme un expert et un guichet unique, pas seulement un portail d'annonces. | - Le calculateur peut être un composant React purement frontend. <br>- Le comparateur peut utiliser le `localStorage` ou l'état du `FavoritesProvider` pour stocker les annonces à comparer. |

## 3.3. Recommandations Esthétiques pour une "Aura" Premium

L'"aura" d'une application est sa capacité à communiquer la qualité, la confiance et la sophistication par le design. L'objectif est de faire en sorte que l'utilisateur *ressente* que KeyHome est la meilleure plateforme avant même d'avoir analysé les fonctionnalités en détail.

| Axe d'Amélioration | Description | Recommandations Concrètes |
| :--- | :--- | :--- |
| **1. Cohérence Visuelle Absolue** | Un design unifié est le fondement du professionnalisme. Les incohérences actuelles (couleurs, espacements, radius) donnent une impression d'amateurisme. | - **Action Prioritaire :** Éradiquer 100% des couleurs et des valeurs de spacing hardcodées au profit des tokens du thème MUI (comme détaillé dans le rapport `2_Graphic_Charter_And_Responsive_Audit.md`). <br>- Définir une échelle de `spacing` (ex: `theme.spacing(1)` = 8px) et l'utiliser partout pour les marges et paddings. |
| **2. Micro-interactions et Feedback Visuel** | Rendre l'interface vivante et réactive. L'application utilise déjà bien `framer-motion` sur la landing page ; il faut étendre cette philosophie. | - **Transitions de page fluides :** Animer la transition entre la liste d'annonces et la page de détail. <br>- **Feedback sur les actions :** Animer subtilement le bouton "Favori" (ex: un petit rebond) lorsqu'il est cliqué. <br>- **Hover effects :** En plus du `translateY`, ajouter une transition douce sur l'ombre des `AdCard` au survol. |
| **3. Typographie et Hiérarchie de l'Information** | Guider l'œil de l'utilisateur vers ce qui est important. | - **Contraste :** Assurer un contraste suffisant entre les couleurs de texte (`text.primary`, `text.secondary`) pour une lisibilité parfaite. <br>- **Poids et Taille :** Utiliser la graisse (`fontWeight`) pour créer une hiérarchie claire. Le prix et le titre doivent être plus proéminents que les attributs secondaires (chambres, SDB). <br>- **Espacement :** Augmenter légèrement l'interlignage (`lineHeight`) dans les descriptions longues pour améliorer le confort de lecture. |
| **4. Iconographie et Identité** | Les icônes sont une partie essentielle du langage visuel. | - **Consistance :** Choisir un seul style d'icônes Material-UI et s'y tenir (ex: `Outlined` partout, ou `Rounded`). Éviter de les mélanger. <br>- **Icônes personnalisées :** Pour les attributs de propriété (Piscine, Wifi, etc.), envisager de créer un set d'icônes personnalisées et uniques à KeyHome pour renforcer l'identité de la marque. |
| **5. Photographie et Présentation** | L'immobilier est un domaine visuel. La manière dont les photos sont présentées est primordiale. | - **Ratio d'aspect unifié :** S'assurer que toutes les miniatures dans les `AdCard` ont le même ratio (ex: 3:2) pour une grille parfaitement alignée. <br>- **Qualité :** Inciter les annonceurs à poster des photos de haute qualité. Le système pourrait même détecter et signaler les images de faible résolution. <br>- **Fallback gracieux :** L'image de remplacement (`placeholder-house.jpg`) doit être esthétiquement plaisante et non une icône cassée. |

---

# Plan d'Implémentation : Module de Sondage


# Plan d'Implémentation Frontend : Module de Sondage

Ce document détaille le plan de développement côté client pour l'intégration d'un module de sondage fonctionnel dans l'application KeyHome. Il couvre le flux utilisateur, les spécifications des composants React et les interactions avec l'API backend.

## 4.1. Flux Utilisateur Conceptuel

Le parcours utilisateur pour les sondages est conçu pour être simple et non intrusif.

1.  **Déclenchement du Sondage :** L'utilisateur se voit proposer de participer à un sondage. Le déclencheur peut être placé à des endroits stratégiques du parcours utilisateur pour maximiser les réponses pertinentes :
    *   Sur la page de profil (`/profile`).
    *   Après une action clé, comme le déblocage réussi des coordonnées d'un annonceur.
    *   Via une notification dans le tableau de bord.

2.  **Participation :** En cliquant sur l'invitation, l'utilisateur est redirigé vers une page dédiée au sondage (ex: `/sondage/experience-utilisateur-q1`).

3.  **Remplissage du Formulaire :** La page affiche l'ensemble des questions du sondage dans un formulaire vertical. Les types de questions suivants seront pris en charge :
    *   **Choix Multiple :** Une seule réponse possible (boutons radio).
    *   **Cases à Cocher :** Plusieurs réponses possibles.
    *   **Échelle d'Évaluation :** Notation par étoiles (1 à 5).
    *   **Texte Libre :** Champ de texte pour une réponse ouverte.

4.  **Soumission :** Une fois le formulaire rempli, l'utilisateur clique sur un bouton "Envoyer mes réponses".

5.  **Remerciement :** Après la soumission réussie, une page ou une modale de remerciement s'affiche pour confirmer la réception des réponses et remercier l'utilisateur pour son temps.

## 4.2. Spécifications des Composants React

L'implémentation s'appuiera sur des composants modulaires et réutilisables.

| Composant | Fichier | Description | Props Clés |
| :--- | :--- | :--- | :--- |
| **`SurveyPrompt`** | `src/components/surveys/SurveyPrompt.tsx` | Un composant d'alerte ou de carte simple qui informe l'utilisateur qu'un sondage est disponible et l'invite à y participer. | `surveyId: string`, `title: string`, `description: string` |
| **`SurveyPage`** | `src/app/sondage/[id]/page.tsx` | La page principale qui orchestre l'affichage du sondage. Elle récupère les données du sondage, gère l'état des réponses et gère la soumission du formulaire. | `params: { id: string }` |
| **`SurveyForm`** | `src/components/surveys/SurveyForm.tsx` | Le composant de formulaire qui affiche une liste de questions. Il est responsable de la logique de rendu conditionnel des questions. | `survey: Survey`, `onSubmit: (answers) => void`, `isSubmitting: boolean` |
| **`QuestionRenderer`** | `src/components/surveys/QuestionRenderer.tsx` | Un composant qui reçoit une seule question et la rend en utilisant le composant MUI approprié en fonction de son type (`question.type`). | `question: SurveyQuestion`, `value: any`, `onChange: (value) => void` |
| **`ThankYou`** | `src/components/surveys/ThankYou.tsx` | Un écran de succès simple affiché après la soumission. | `message: string` |

## 4.3. Services et Interactions avec l'API

Une nouvelle couche de service sera créée pour communiquer avec le backend Laravel.

**Fichier : `src/services/surveys.service.ts`**

```typescript
import api from '@/lib/api';
import { Survey, SurveyAnswerPayload } from '@/types'; // Les types Survey, SurveyQuestion, etc. devront être ajoutés à src/types/index.ts

export const surveysService = {
  /**
   * Récupère la structure complète d'un sondage (titre, questions, options).
   * @param id - L'ID du sondage à récupérer.
   */
  async get(id: string): Promise<Survey> {
    const { data } = await api.get(`/surveys/${id}`);
    return data.data ?? data;
  },

  /**
   * Soumet les réponses d'un utilisateur pour un sondage donné.
   * @param surveyId - L'ID du sondage.
   * @param answers - Un tableau d'objets contenant les réponses.
   */
  async submitResponse(
    surveyId: string,
    answers: SurveyAnswerPayload[]
  ): Promise<void> {
    await api.post(`/surveys/${surveyId}/responses`, { answers });
  },
};

// Nouveaux types à ajouter dans src/types/index.ts

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

export type QuestionType = 'multiple_choice' | 'checkbox' | 'rating' | 'text';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[] | null; // Tableau de chaînes pour les choix/checkbox
}

export interface SurveyAnswerPayload {
  question_id: string;
  answer: string | string[] | number; // La valeur de la réponse
}

```



# Plan d'Implémentation Backend (Laravel) : Module de Sondage

Ce document fournit un plan de développement détaillé pour la création du module de sondage côté backend avec le framework Laravel. Il inclut la conception de la base de données, les routes d'API, la logique du contrôleur et les règles de validation.

## 5.1. Conception de la Base de Données (Migrations)

Trois tables principales sont nécessaires pour gérer les sondages, leurs questions et les réponses des utilisateurs.

### 1. Table `surveys`

Cette table stocke les informations de base sur chaque sondage.

**Fichier : `database/migrations/YYYY_MM_DD_HHMMSS_create_surveys_table.php`**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surveys');
    }
};
```

### 2. Table `survey_questions`

Cette table stocke chaque question liée à un sondage, son type et ses options.

**Fichier : `database/migrations/YYYY_MM_DD_HHMMSS_create_survey_questions_table.php`**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('survey_id')->constrained()->onDelete('cascade');
            $table->text('text');
            $table->enum('type', ['multiple_choice', 'checkbox', 'rating', 'text']);
            $table->json('options')->nullable(); // Pour 'multiple_choice' et 'checkbox'
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_questions');
    }
};
```

### 3. Table `survey_responses`

Cette table stocke les réponses individuelles de chaque utilisateur à chaque question.

**Fichier : `database/migrations/YYYY_MM_DD_HHMMSS_create_survey_responses_table.php`**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('survey_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('survey_question_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->text('answer'); // Stocke la réponse, JSON pour les checkbox
            $table->timestamps();

            // Empêcher un utilisateur de répondre plusieurs fois à la même question
            $table->unique(['survey_question_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
    }
};
```

## 5.2. Modèles Eloquent

Les modèles correspondants pour interagir avec ces tables.

**`app/Models/Survey.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'description', 'is_active'];
    protected $casts = ['id' => 'string'];
    public $incrementing = false;

    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('order');
    }
}
```

**`app/Models/SurveyQuestion.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    use HasFactory;
    protected $fillable = ['survey_id', 'text', 'type', 'options', 'order'];
    protected $casts = [
        'id' => 'string',
        'survey_id' => 'string',
        'options' => 'array',
    ];
    public $incrementing = false;
}
```

**`app/Models/SurveyResponse.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    use HasFactory;
    protected $fillable = ['survey_id', 'survey_question_id', 'user_id', 'answer'];
    protected $casts = [
        'id' => 'string',
        'survey_id' => 'string',
        'survey_question_id' => 'string',
        'user_id' => 'string',
    ];
    public $incrementing = false;
}
```

## 5.3. Routes API

Les points d'accès pour le frontend.

**`routes/api.php`**
```php
use App\Http\Controllers\SurveyController;

// ... autres routes

Route::prefix('surveys')->group(function () {
    // Pour les administrateurs (gestion complète des sondages)
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/', [SurveyController::class, 'index']);
        Route::post('/', [SurveyController::class, 'store']);
        Route::get('/{survey}/results', [SurveyController::class, 'results']);
        // Ajouter PUT, DELETE pour la gestion complète
    });

    // Pour les utilisateurs authentifiés
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/{survey}', [SurveyController::class, 'show']);
        Route::post('/{survey}/responses', [SurveyController::class, 'submitResponse']);
    });
});
```

## 5.4. Logique du Contrôleur

La logique métier pour gérer les requêtes.

**`app/Http/Controllers/SurveyController.php`**
```php
<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SurveyController extends Controller
{
    /**
     * (Admin) Affiche la liste de tous les sondages.
     */
    public function index()
    {
        return Survey::withCount('questions')->latest()->paginate();
    }

    /**
     * (Admin) Crée un nouveau sondage avec ses questions.
     */
    public function store(Request $request)
    {
        // ... Logique de validation complexe pour créer un sondage et ses questions
    }

    /**
     * (User) Affiche un sondage spécifique avec ses questions.
     */
    public function show(Survey $survey)
    {
        $survey->load('questions');
        return response()->json($survey);
    }

    /**
     * (User) Soumet les réponses à un sondage.
     */
    public function submitResponse(Request $request, Survey $survey)
    {
        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'uuid', Rule::exists('survey_questions', 'id')->where('survey_id', $survey->id)],
            'answers.*.answer' => ['required'],
        ]);

        $user = $request->user();

        // Utiliser une transaction pour garantir l'intégrité des données
        DB::transaction(function () use ($validated, $survey, $user) {
            foreach ($validated['answers'] as $response) {
                // Valider la réponse en fonction du type de question
                $question = $survey->questions()->find($response['question_id']);
                if (!$question) continue; // Devrait être empêché par la validation

                // Exemple de validation de type
                if ($question->type === 'rating' && !in_array($response['answer'], [1, 2, 3, 4, 5])) {
                    throw ValidationException::withMessages(['answer' => 'La note doit être entre 1 et 5.']);
                }

                $survey->responses()->updateOrCreate(
                    [
                        'survey_question_id' => $response['question_id'],
                        'user_id' => $user->id,
                    ],
                    ['answer' => is_array($response['answer']) ? json_encode($response['answer']) : $response['answer']]
                );
            }
        });

        return response()->json(['message' => 'Merci d\'avoir participé !'], 201);
    }

    /**
     * (Admin) Récupère les résultats agrégés d'un sondage.
     */
    public function results(Survey $survey)
    {
        // ... Logique d'agrégation des réponses
    }
}
```

## 5.5. Règles de Validation

Un exemple de règles de validation pour la soumission des réponses. La validation peut être affinée directement dans la méthode `submitResponse` pour vérifier que la réponse correspond au type de la question.

```php
// Dans la méthode submitResponse du SurveyController

$request->validate([
    'answers' => ['required', 'array', 'min:1'],
    'answers.*.question_id' => [
        'required',
        'uuid',
        // S'assurer que la question appartient bien au sondage en cours
        Rule::exists('survey_questions', 'id')->where('survey_id', $survey->id)
    ],
    'answers.*.answer' => ['required'], // La validation de base
]);

// Ensuite, une validation plus fine par type de question dans la boucle
foreach ($validated['answers'] as $response) {
    $question = $survey->questions()->find($response['question_id']);

    switch ($question->type) {
        case 'rating':
            if (!is_numeric($response['answer']) || $response['answer'] < 1 || $response['answer'] > 5) {
                // Gérer l'erreur
            }
            break;
        case 'checkbox':
            if (!is_array($response['answer']) || count(array_diff($response['answer'], $question->options)) > 0) {
                // Gérer l'erreur (une option soumise n'existe pas)
            }
            break;
        // ... autres cas
    }
}
```
