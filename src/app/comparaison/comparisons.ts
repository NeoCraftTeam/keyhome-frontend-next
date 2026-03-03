export interface ComparisonSection {
  title: string;
  items: { label: string; a: string; b: string }[];
}

export interface Comparison {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  labelA: string;
  labelB: string;
  intro: string;
  verdict: string;
  sections: ComparisonSection[];
  relatedLinks: { href: string; label: string }[];
}

export const COMPARISONS: Record<string, Comparison> = {
  'louer-vs-acheter': {
    slug: 'louer-vs-acheter',
    title: 'Louer vs Acheter en Afrique de l\'Ouest : Que choisir en 2026 ?',
    metaTitle: 'Louer vs Acheter un bien immobilier en Afrique — Comparatif 2026',
    metaDescription:
      'Faut-il louer ou acheter un bien immobilier en Afrique de l\'Ouest ? Analyse complète des avantages et inconvénients selon votre situation, votre ville et votre budget.',
    labelA: 'Location',
    labelB: 'Achat',
    intro:
      'C\'est LA question que se posent des milliers de personnes à Douala, Abidjan, Dakar et Cotonou chaque année. Louer offre flexibilité et liquidité, acheter construit un patrimoine durable. Voici tout ce qu\'il faut savoir pour faire le bon choix dans le contexte africain.',
    verdict:
      'En Afrique de l\'Ouest, si vous prévoyez de rester plus de 5 ans dans la même ville et disposez d\'un apport de 20-30%, l\'achat est généralement plus rentable. Dans le cas contraire, la location reste la solution la plus sage — surtout dans un marché foncier où les titres fonciers sont encore complexes à obtenir.',
    sections: [
      {
        title: 'Coût financier',
        items: [
          { label: 'Investissement initial', a: 'Caution (1-3 mois) + frais d\'agence', b: 'Apport 20-30% + frais de notaire (5-8%)' },
          { label: 'Mensualité typique (Douala 3 pièces)', a: '80 000 – 200 000 FCFA/mois', b: 'Crédit immobilier : 100 000 – 350 000 FCFA/mois' },
          { label: 'Charges imprévues', a: 'Couvertes par le bailleur (gros travaux)', b: 'À votre charge entièrement' },
        ],
      },
      {
        title: 'Flexibilité & style de vie',
        items: [
          { label: 'Mobilité professionnelle', a: 'Déménagement facile', b: 'Contraignant (vente ou mise en location)' },
          { label: 'Personnalisation du logement', a: 'Limité (accord bailleur requis)', b: 'Liberté totale de rénovation' },
          { label: 'Sécurité d\'occupation', a: 'Risque de non-renouvellement', b: 'Propriétaire = sécurité maximale' },
        ],
      },
      {
        title: 'Patrimoine & investissement',
        items: [
          { label: 'Construction de patrimoine', a: 'L\'argent "disparaît" chaque mois', b: 'Capital constitué sur le long terme' },
          { label: 'Effet de levier', a: 'Aucun', b: 'Crédit bancaire amplifie le retour' },
          { label: 'Revenus locatifs possibles', a: 'Non', b: 'Sous-location possible' },
        ],
      },
      {
        title: 'Contexte africain spécifique',
        items: [
          { label: 'Accès au crédit', a: 'N/A', b: 'Taux élevés (12-18%) — limité aux salariés du secteur formel' },
          { label: 'Sécurité juridique', a: 'Contrats souvent informels', b: 'Titre foncier complexe dans certains pays' },
          { label: 'Marché locatif (demande)', a: 'Fort dans les grandes villes', b: 'Bonne rentabilité locative brute (6-10%)' },
        ],
      },
    ],
    relatedLinks: [
      { href: '/type-bien/appartement', label: 'Appartements disponibles' },
      { href: '/type-bien/maison', label: 'Maisons à vendre' },
      { href: '/immobilier/douala', label: 'Marché immobilier Douala' },
      { href: '/immobilier/abidjan', label: 'Marché immobilier Abidjan' },
      { href: '/blog', label: 'Nos guides immobiliers' },
    ],
  },

  'douala-vs-yaounde': {
    slug: 'douala-vs-yaounde',
    title: 'Immobilier à Douala vs Yaoundé : Où investir en 2026 ?',
    metaTitle: 'Immobilier Douala vs Yaoundé — Prix, quartiers, rentabilité 2026',
    metaDescription:
      'Comparaison complète du marché immobilier à Douala et Yaoundé. Prix au m², quartiers prisés, rentabilité locative et tendances 2026 pour investir intelligemment.',
    labelA: 'Douala',
    labelB: 'Yaoundé',
    intro:
      'Douala, capitale économique, et Yaoundé, capitale politique — les deux principales métropoles du Cameroun offrent des opportunités immobilières très distinctes. Loyers, prix d\'achat, quartiers en vogue : voici le comparatif complet pour guider votre choix.',
    verdict:
      'Douala offre une rentabilité locative légèrement supérieure grâce à la forte demande d\'expatriés et de cadres. Yaoundé séduit par ses quartiers résidentiels calmes, ses prix d\'achat plus accessibles et la stabilité liée à la présence des institutions d\'État. Pour l\'investissement locatif pur, Douala gagne. Pour la résidence principale et la qualité de vie, Yaoundé est souvent préférée.',
    sections: [
      {
        title: 'Prix du marché (2026)',
        items: [
          { label: 'Loyer moyen 3 pièces', a: '120 000 – 250 000 FCFA/mois', b: '80 000 – 180 000 FCFA/mois' },
          { label: 'Prix achat appartement (m²)', a: '200 000 – 450 000 FCFA/m²', b: '150 000 – 350 000 FCFA/m²' },
          { label: 'Rentabilité locative brute', a: '7 – 10%', b: '6 – 8%' },
        ],
      },
      {
        title: 'Quartiers prisés',
        items: [
          { label: 'Standing supérieur', a: 'Bonapriso, Bonanjo, Akwa', b: 'Bastos, Omnisport, Fébé' },
          { label: 'Cadres / expatriés', a: 'Bonamoussadi, Makepe, Deido', b: 'Tsinga, Santa Barbara, Mvog-Ada' },
          { label: 'Budget moyen', a: 'Ndokotti, Logbessou, Kotto', b: 'Nkolbisson, Simbock, Mimboman' },
        ],
      },
      {
        title: 'Environnement économique',
        items: [
          { label: 'Profil de la ville', a: 'Capital économique, port, industrie', b: 'Capitale administrative, fonctionnaires, ONG' },
          { label: 'Population (2026 est.)', a: '~4 millions', b: '~3.8 millions' },
          { label: 'Demande locative', a: 'Très forte (expatriés, salariés privés)', b: 'Stable (fonctionnaires, étudiants)' },
        ],
      },
      {
        title: 'Qualité de vie',
        items: [
          { label: 'Embouteillages', a: 'Très importants', b: 'Importants mais moins qu\'à Douala' },
          { label: 'Sécurité', a: 'Variable selon le quartier', b: 'Globalement bonne' },
          { label: 'Infrastructures', a: 'Port, aéroport international', b: 'Aéroport, routes bien entretenues' },
        ],
      },
    ],
    relatedLinks: [
      { href: '/immobilier/douala', label: 'Annonces à Douala' },
      { href: '/immobilier/yaounde', label: 'Annonces à Yaoundé' },
      { href: '/search?city=douala', label: 'Rechercher à Douala' },
      { href: '/search?city=yaounde', label: 'Rechercher à Yaoundé' },
    ],
  },

  'appartement-vs-maison': {
    slug: 'appartement-vs-maison',
    title: 'Appartement vs Maison en Afrique : Avantages et inconvénients',
    metaTitle: 'Appartement ou Maison en Afrique de l\'Ouest ? Comparatif complet 2026',
    metaDescription:
      'Appartement ou maison individuelle : lequel choisir en Afrique de l\'Ouest ? Sécurité, charges, superficie, prix — tout ce que vous devez comparer avant de décider.',
    labelA: 'Appartement',
    labelB: 'Maison',
    intro:
      'L\'appartement séduit par son prix, sa sécurité et sa localisation en centre-ville. La maison individuelle attire par son espace, son jardin et sa liberté. Mais dans le contexte spécifique des grandes villes d\'Afrique de l\'Ouest, les avantages et inconvénients peuvent surprendre.',
    verdict:
      'Pour les familles avec enfants ou les personnes souhaitant de l\'espace, la maison reste le choix privilégié dans les grandes villes africaines où les prix restent accessibles. L\'appartement convient mieux aux actifs urbains, célibataires ou couples sans enfant, recherchant sécurité et proximité du lieu de travail. Les deux options sont disponibles sur KeyHome avec des annonces vérifiées.',
    sections: [
      {
        title: 'Espace & confort',
        items: [
          { label: 'Surface moyenne disponible', a: '45 – 120 m²', b: '80 – 300 m²' },
          { label: 'Espace extérieur', a: 'Balcon uniquement (si disponible)', b: 'Jardin, terrasse, cour' },
          { label: 'Parking', a: 'Payant ou limité', b: 'Généralement inclus' },
        ],
      },
      {
        title: 'Coût & charges',
        items: [
          { label: 'Prix location (3 pièces Douala)', a: '120 000 – 200 000 FCFA', b: '150 000 – 400 000 FCFA' },
          { label: 'Charges mensuelles', a: 'Syndic, gardiennage, eau communes', b: 'Eau, électricité, entretien jardin' },
          { label: 'Charges imprévues', a: 'Partielles (mutualisées)', b: 'Entièrement à votre charge' },
        ],
      },
      {
        title: 'Sécurité & tranquillité',
        items: [
          { label: 'Sécurité physique', a: 'Gardien, interphone, résidence fermée', b: 'Dépend du quartier et de la clôture' },
          { label: 'Intimité', a: 'Voisins directs, bruit', b: 'Plus d\'indépendance' },
          { label: 'Nuisances sonores', a: 'Variable selon l\'immeuble', b: 'Moins de bruit en général' },
        ],
      },
    ],
    relatedLinks: [
      { href: '/type-bien/appartement', label: 'Voir les appartements' },
      { href: '/type-bien/maison', label: 'Voir les maisons' },
      { href: '/type-bien/villa', label: 'Voir les villas' },
      { href: '/search', label: 'Recherche libre' },
    ],
  },
};
