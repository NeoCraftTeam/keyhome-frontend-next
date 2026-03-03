/**
 * Blog post definitions — stored as static data for now.
 * Can be migrated to a CMS (Sanity, Strapi, Contentful) later.
 */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'eviter-arnaques-immobilieres-cameroun',
    title: 'Comment éviter les arnaques immobilières au Cameroun : Guide 2026',
    excerpt:
      "Découvrez les 7 types d'arnaques immobilières les plus courantes au Cameroun et apprenez à reconnaître les fausses annonces. Checklist anti-arnaque incluse.",
    date: '2026-04-01',
    readTime: '8 min',
    category: 'Guide',
  },
  {
    slug: 'prix-loyers-douala-2026',
    title: 'Prix des loyers à Douala en 2026 : quartier par quartier',
    excerpt:
      "Analyse complète des prix des loyers à Douala par quartier (Akwa, Bonapriso, Bonamoussadi, Deido). Évolution vs 2025 et carte interactive des prix.",
    date: '2026-05-01',
    readTime: '6 min',
    category: 'Marché',
  },
  {
    slug: 'location-appartement-abidjan-guide',
    title: 'Location appartement à Abidjan : le guide complet du locataire',
    excerpt:
      "Tout ce qu'il faut savoir pour louer un appartement à Abidjan : quartiers, budget, documents nécessaires et erreurs à éviter.",
    date: '2026-06-01',
    readTime: '7 min',
    category: 'Guide',
  },
];

