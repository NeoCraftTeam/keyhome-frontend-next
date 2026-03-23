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
  content?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'eviter-arnaques-immobilieres-',
    title: 'Comment éviter les arnaques immobilières au Cameroun : Guide 2026',
    excerpt:
      "Découvrez les 7 types d'arnaques immobilières les plus courantes au Cameroun et apprenez à reconnaître les fausses annonces. Checklist anti-arnaque incluse.",
    date: '2026-04-01',
    readTime: '8 min',
    category: 'Guide',
    content: `
# Comment éviter les arnaques immobilières au Cameroun : Guide 2026

Le marché immobilier camerounais est dynamique, mais il attire aussi des arnaqueurs. Voici les 7 types d'arnaques les plus courantes et comment vous en protéger.

## 1. Les fausses annonces à prix trop bas

Un appartement à Bonamoussadi proposé à 50 000 FCFA/mois ? Méfiance. Les biens en dessous du prix du marché de plus de 30% sont souvent des appâts. **Sur KeyHome, toutes les annonces sont vérifiées** par notre équipe avant publication.

## 2. Le propriétaire « à l'étranger »

Un propriétaire qui ne peut pas vous rencontrer car il est « en France » ou « aux États-Unis » et demande un virement Western Union avant visite : arnaque classique. Ne versez jamais d'acompte sans avoir visité le bien.

## 3. La double location

Un bien loué à plusieurs locataires simultanément. Exigez toujours de voir l'original du titre foncier ou du bail commercial, jamais une photocopie.

## 4. Le mandataire fantôme

Vérifiez l'existence légale de l'agence : numéro de registre de commerce, adresse physique, carte professionnelle de l'agent. Les agences partenaires KeyHome sont toutes certifiées.

## 5. Les frais cachés

Frais de dossier, caution « non remboursable », frais de ménage exorbitants. Lisez le contrat de bail entier avant de signer.

## 6. Le bien hypothéqué non déclaré

Demandez un certificat de situation juridique à la Conservation Foncière pour vérifier l'absence d'hypothèque ou de saisie sur le bien.

## 7. Les photos volées

Des photos de luxe pour un bien ordinaire. Faites une recherche inversée d'images (Google Images) des photos de l'annonce.

## ✅ Checklist anti-arnaque KeyHome

- [ ] Visite physique du bien avant tout versement
- [ ] Identité du propriétaire vérifiée (CNI + titre foncier)
- [ ] Aucun versement par Western Union / Mobile Money avant signature
- [ ] Contrat de bail en 2 exemplaires originaux
- [ ] Reçu pour chaque paiement effectué
    `,
  },
  {
    slug: 'prix-loyers-douala-2026',
    title: 'Prix des loyers à Douala en 2026 : quartier par quartier',
    excerpt:
      "Analyse complète des prix des loyers à Douala par quartier (Akwa, Bonapriso, Bonamoussadi, Deido). Évolution vs 2025 et carte interactive des prix.",
    date: '2026-05-01',
    readTime: '6 min',
    category: 'Marché',
    content: `
# Prix des loyers à Douala en 2026

Le marché locatif de Douala connaît une hausse moyenne de 8% en 2026 par rapport à 2025. Voici une analyse quartier par quartier.

## Akwa (Centre des affaires)

| Type de bien | Prix moyen/mois |
|---|---|
| Studio meublé | 120 000 – 180 000 FCFA |
| Appartement 2 pièces | 200 000 – 350 000 FCFA |
| Appartement 3 pièces | 350 000 – 600 000 FCFA |

Akwa reste le quartier le plus cher de Douala, porté par la demande des expatriés et des cadres d'entreprises.

## Bonapriso (Résidentiel haut de gamme)

| Type de bien | Prix moyen/mois |
|---|---|
| Villa 3 chambres | 500 000 – 1 200 000 FCFA |
| Appartement 3 pièces | 300 000 – 550 000 FCFA |
| Appartement 2 pièces | 180 000 – 300 000 FCFA |

Quartier prisé des familles expatriées et diplomates. Offre limitée, forte demande.

## Bonamoussadi (Résidentiel dynamique)

| Type de bien | Prix moyen/mois |
|---|---|
| Appartement meublé | 150 000 – 280 000 FCFA |
| Appartement non meublé 3p | 100 000 – 200 000 FCFA |
| Chambre / Studio | 50 000 – 90 000 FCFA |

Le rapport qualité-prix le plus attractif de Douala. Idéal pour les jeunes professionnels.

## Deido (Populaire et accessible)

| Type de bien | Prix moyen/mois |
|---|---|
| Chambre simple | 20 000 – 40 000 FCFA |
| Appartement 2 pièces | 60 000 – 120 000 FCFA |
| Appartement 3 pièces | 100 000 – 180 000 FCFA |

Quartier populaire avec des prix très accessibles. Forte communauté locale.

## Tendances 2026

- **+12%** à Akwa et Bonapriso (pression expatriés, bureaux)
- **+7%** à Bonamoussadi (nouveaux développements résidentiels)
- **+4%** à Deido (marché stable, peu de nouvelles constructions)

*Source : Données KeyHome Q1 2026 — 2 400+ annonces analysées*
    `,
  },
  {
    slug: 'location-appartement-abidjan-guide',
    title: 'Location appartement à Abidjan : le guide complet du locataire',
    excerpt:
      "Tout ce qu'il faut savoir pour louer un appartement à Abidjan : quartiers, budget, documents nécessaires et erreurs à éviter.",
    date: '2026-06-01',
    readTime: '7 min',
    category: 'Guide',
    content: `
# Location appartement à Abidjan : guide complet

Abidjan est la métropole économique de l'Afrique de l'Ouest. Louer un appartement dans cette ville en constante évolution demande une préparation sérieuse.

## Les quartiers incontournables

### Cocody (Vallons, 2 Plateaux, Riviera)
Le choix des familles et des expatriés. Sécurisé, verdoyant, proche des écoles internationales. Budget : 200 000 – 1 000 000 FCFA/mois.

### Plateau (Centre des affaires)
Idéal pour les cadres travaillant en zone franche. Essentiellement des appartements meublés en résidence sécurisée. Budget : 250 000 – 800 000 FCFA/mois.

### Marcory / Koumassi
Rapport qualité-prix excellent. Quartiers en développement, transports en commun accessibles. Budget : 80 000 – 250 000 FCFA/mois.

## Budget moyen par type de bien

| Bien | Cocody | Marcory |
|---|---|---|
| Studio non meublé | 150 000 | 60 000 |
| F2 meublé | 350 000 | 130 000 |
| Villa 4 chambres | 800 000 | 350 000 |

*Tous les prix en FCFA/mois*

## Documents à préparer

1. Pièce d'identité (CNI ou passeport)
2. Justificatif de revenus (3 derniers bulletins de salaire ou extrait de compte)
3. Contrat de travail ou attestation d'employeur
4. 2 photos d'identité
5. Caution solidaire (garant) si revenus insuffisants

## Erreurs à éviter

- **Payer une caution sans contrat** : inacceptable, même si le propriétaire "est pressé"
- **Ne pas inventorier l'état des lieux** : prenez des photos datées à l'entrée
- **Ignorer les charges** : eau, électricité, gardiennage peuvent doubler le loyer réel
    `,
  },
  {
    slug: 'investir-immobilier-afrique-2026',
    title: "Investir dans l'immobilier en Afrique : opportunités et risques en 2026",
    excerpt:
      "Cameroun, Côte d'Ivoire, Sénégal — où investir dans l'immobilier en Afrique en 2026 ? Rendements locatifs, risques à connaître et conseils d'experts.",
    date: '2026-07-01',
    readTime: '9 min',
    category: "Investissement",
  },
  {
    slug: 'droit-bail-cameroun-locataire',
    title: 'Vos droits en tant que locataire au Cameroun : ce que dit la loi',
    excerpt:
      "Durée du préavis, restitution de caution, obligations du bailleur, recours en cas de litige — tout ce que vous devez savoir sur le droit du bail au Cameroun.",
    date: '2026-08-01',
    readTime: '10 min',
    category: 'Juridique',
  },
  {
    slug: 'vendre-bien-immobilier-cameras-etapes',
    title: 'Vendre un bien immobilier au Cameroun : les 8 étapes clés',
    excerpt:
      "De l'estimation à la signature chez le notaire, découvrez le processus complet de vente immobilière au Cameroun : documents, délais, frais et pièges à éviter.",
    date: '2026-09-01',
    readTime: '8 min',
    category: "Vente",
  },
];

