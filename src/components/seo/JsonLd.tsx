import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';
import { getSiteOrigin } from '@/lib/site-url';

/**
 * JSON-LD structured data schemas for SEO rich snippets.
 *
 * Schemas: WebSite (SearchAction / sitelinks), Organization,
 * RealEstateAgent, SoftwareApplication, FAQPage (10 questions),
 * HowTo, and BreadcrumbList.
 *
 * Every description is written as a compelling, benefit-driven
 * hook that addresses real pain points of housing seekers in Africa
 * (scams, intermediaries, wasted time, trust) to maximise CTR
 * from Google SERPs.
 */

const BASE_URL = getSiteOrigin();

/* ------------------------------------------------------------------ */
/*  1. WebSite — enables the Google sitelinks search box              */
/* ------------------------------------------------------------------ */
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KeyHome',
  alternateName: BRAND_TITLE_WITH_TAGLINE,
  url: BASE_URL,
  inLanguage: 'fr',
  description:
    `${BRAND_TAGLINE}. ` +
    'KeyHome vous connecte directement aux propriétaires vérifiés, sans intermédiaire. ' +
    "Parcourez des milliers d'annonces avec photos réelles, prix transparents et coordonnées débloquées en un clic sécurisé.",
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/* ------------------------------------------------------------------ */
/*  2. Organization — knowledge panel & brand authority               */
/* ------------------------------------------------------------------ */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KeyHome',
  legalName: 'KeyHome by NeoCraftTeam',
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  image: `${BASE_URL}/opengraph-image`,
  description:
    `${BRAND_TAGLINE}. ` +
    'KeyHome est la plateforme immobilière de confiance. ' +
    'Nous vérifions chaque annonce manuellement — photos authentiques, prix cohérents, propriétaires identifiés — ' +
    'pour que vous trouviez votre bien en toute sécurité. ' +
    'Inscription gratuite, paiement sécurisé, contact direct : votre futur logement est à portée de clic.',
  slogan: BRAND_TAGLINE,
  foundingDate: '2024',
  sameAs: [
    'https://x.com/Keyhomeapp',
    'https://www.facebook.com/keyhomeapp',
    'https://www.linkedin.com/company/keyhome',
    'https://www.instagram.com/keyhome.app',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'service client',
    email: 'contact@keyhome.app',
    availableLanguage: ['French', 'English'],
    areaServed: {
      '@type': 'Continent',
      name: 'Afrique',
    },
  },
  knowsAbout: [
    'Immobilier en Afrique',
    'Location appartement Afrique',
    'Vente maison Afrique',
    'Terrain à vendre',
    'Agence immobilière en ligne',
  ],
};

/* ------------------------------------------------------------------ */
/*  3. RealEstateAgent — niche schema for real-estate platforms       */
/* ------------------------------------------------------------------ */
const realEstateAgentSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'KeyHome',
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  description:
    `${BRAND_TAGLINE}. ` +
    'Vous cherchez un appartement à Douala, une villa à Abidjan ou un terrain à Cotonou ? ' +
    'KeyHome regroupe les meilleures offres immobilières en Afrique, vérifiées une par une par notre équipe. ' +
    'Zéro arnaque, zéro intermédiaire : vous contactez directement le propriétaire après un micro-paiement sécurisé.',
  areaServed: [
    { '@type': 'Country', name: 'Cameroun' },
    { '@type': 'Country', name: 'Bénin' },
    { '@type': 'Country', name: 'Togo' },
    { '@type': 'Country', name: "Côte d'Ivoire" },
    { '@type': 'Country', name: 'Ghana' },
    { '@type': 'Country', name: 'Mali' },
    { '@type': 'Country', name: 'Sénégal' },
  ],
  priceRange: 'Gratuit — micro-paiements à partir de 500 FCFA',
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: 'Mise en relation immobilière sécurisée',
      description:
        'Accès direct aux coordonnées de propriétaires vérifiés (téléphone, WhatsApp, email) ' +
        'après un micro-paiement Mobile Money ou carte bancaire. Fini les faux numéros et les visites inutiles.',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  4. SoftwareApplication — rich snippet with rating stars           */
/* ------------------------------------------------------------------ */
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'KeyHome',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, Android, iOS',
  url: BASE_URL,
  description:
    `${BRAND_TAGLINE}. ` +
    "L'application qui révolutionne la recherche immobilière en Afrique. " +
    'Carte interactive, filtres intelligents, photos vérifiées et contact direct avec les propriétaires. ' +
    'Plus besoin de faire confiance à des intermédiaires — débloquez les coordonnées en toute sécurité avec Mobile Money. ' +
    "Rejoignez des milliers d'utilisateurs qui ont déjà trouvé leur logement grâce à KeyHome.",
  screenshot: `${BASE_URL}/opengraph-image`,
  featureList:
    'Recherche par carte interactive, Filtres avancés (ville, budget, superficie), ' +
    'Annonces vérifiées manuellement, Paiement sécurisé Mobile Money & carte, ' +
    'Contact direct propriétaire (appel, WhatsApp, email), Favoris et alertes personnalisées, ' +
    'Annonces à proximité par géolocalisation',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'XOF',
    description:
      'Inscription 100% gratuite. Parcourez toutes les annonces sans frais. ' +
      "Vous ne payez qu'un micro-montant (à partir de 500 FCFA) uniquement quand vous souhaitez obtenir les coordonnées d'un propriétaire.",
  },
  // NOTE: aggregateRating removed — only add back when real review data is
  // available from the backend to avoid Google manual penalty for fake markup.
};

/* ------------------------------------------------------------------ */
/*  5. FAQPage — 10 questions that dominate SERPs                     */
/* ------------------------------------------------------------------ */
const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "C'est quoi KeyHome et pourquoi c'est différent des autres sites immobiliers ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'KeyHome est la seule plateforme immobilière en Afrique où chaque annonce est vérifiée manuellement par notre équipe. ' +
          'Contrairement aux sites classiques remplis de fausses annonces et de numéros qui ne répondent jamais, ' +
          'chez KeyHome vous avez la garantie de photos réelles, de prix cohérents et de propriétaires authentiques. ' +
          'Le secret ? Un micro-paiement sécurisé qui filtre les curieux et vous connecte uniquement à des contacts sérieux.',
      },
    },
    {
      '@type': 'Question',
      name: "Est-ce que l'inscription sur KeyHome est gratuite ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "Oui, l'inscription est 100% gratuite et le restera toujours. " +
          'Vous pouvez parcourir toutes les annonces, voir les photos, les descriptions et la localisation sans rien payer. ' +
          "Vous ne payez un petit montant (à partir de 500 FCFA) que lorsque vous décidez d'obtenir le numéro de téléphone ou le WhatsApp du propriétaire. " +
          "C'est ce système qui garantit que seuls les contacts sérieux vous joignent — et inversement.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment KeyHome vérifie les annonces pour éviter les arnaques ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Chaque annonce publiée sur KeyHome passe par un processus de modération rigoureux en 3 étapes : ' +
          "vérification de l'authenticité des photos (pas de stock photos), validation de la cohérence du prix par rapport au quartier et au type de bien, " +
          "et confirmation de l'identité du propriétaire ou de l'agence. " +
          'Les annonces douteuses sont rejetées. Si malgré tout une annonce vous semble suspecte, notre équipe la retire sous 24h après signalement.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels pays et villes sont disponibles sur KeyHome ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'KeyHome couvre activement le Cameroun (Douala, Yaoundé, Bafoussam, Garoua), le Bénin (Cotonou, Porto-Novo), ' +
          "le Togo (Lomé, Kara), la Côte d'Ivoire (Abidjan, Bouaké), le Ghana (Accra, Kumasi), le Mali (Bamako) et le Sénégal (Dakar). " +
          'Nous nous développons rapidement — de nouvelles villes et pays sont ajoutés chaque mois. ' +
          'Suivez-nous pour être informé dès que votre ville est disponible !',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels moyens de paiement sont acceptés sur KeyHome ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'KeyHome accepte tous les moyens de paiement les plus utilisés en Afrique : ' +
          'Mobile Money (MTN Mobile Money, Moov Money, Orange Money, Wave), ' +
          'cartes bancaires (Visa, Mastercard) et paiement par Flutterwave — le tout chiffré et sécurisé. ' +
          'Votre transaction est confirmée instantanément et vous recevez immédiatement les coordonnées du propriétaire. ' +
          'En cas de problème, notre support client vous rembourse.',
      },
    },
    {
      '@type': 'Question',
      name: "Combien coûte le déblocage des coordonnées d'un propriétaire ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "Le prix de déblocage est un micro-paiement à partir de 500 FCFA par annonce — c'est-à-dire moins que le coût d'un taxi. " +
          'Ce montant vous donne un accès permanent aux coordonnées complètes : numéro de téléphone, WhatsApp et email. ' +
          "C'est ce petit investissement qui vous protège des faux annonceurs et garantit que le propriétaire est réel et joignable.",
      },
    },
    {
      '@type': 'Question',
      name: 'Je suis propriétaire, comment publier mon annonce sur KeyHome ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "C'est simple et gratuit ! Créez votre compte, cliquez sur « Publier une annonce », " +
          'ajoutez vos photos (minimum 3 recommandées), renseignez le prix, la localisation et la description détaillée. ' +
          'Après validation par notre équipe de modération (généralement sous 24h), votre annonce sera visible par des milliers de chercheurs qualifiés. ' +
          'Vous ne recevrez que des contacts sérieux, car chaque personne a payé pour obtenir vos coordonnées.',
      },
    },
    {
      '@type': 'Question',
      name: "Le contact direct signifie-t-il qu'il n'y a pas d'intermédiaire ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "Exactement. KeyHome n'est pas une agence immobilière — c'est une plateforme de mise en relation directe. " +
          "Il n'y a aucune commission d'agence, aucun intermédiaire caché. " +
          "Quand vous débloquez les coordonnées, vous parlez directement au propriétaire ou à l'agence qui gère le bien. " +
          'Vous négociez vous-même, vous visitez quand vous voulez, vous décidez librement.',
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je utiliser KeyHome pour trouver un terrain à acheter ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Absolument ! KeyHome ne se limite pas à la location. Vous trouverez des terrains à vendre, ' +
          'des maisons en vente, des villas, des appartements et même des locaux commerciaux. ' +
          'Utilisez les filtres de recherche pour sélectionner « Terrain » et ajustez votre budget et la localisation souhaitée. ' +
          "La carte interactive vous permet de visualiser exactement l'emplacement de chaque terrain disponible.",
      },
    },
    {
      '@type': 'Question',
      name: 'Que se passe-t-il si les coordonnées débloquées ne fonctionnent pas ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "Votre satisfaction est notre priorité. Si après déblocage le numéro ne répond pas ou s'avère invalide, " +
          "contactez immédiatement notre service client via l'application. " +
          'Nous enquêtons sous 24h et si le contact est effectivement faux (ce qui est très rare grâce à notre vérification), ' +
          "vous êtes remboursé intégralement. Nous retirons également l'annonce pour protéger les autres utilisateurs.",
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  6. HowTo — step-by-step rich snippet                             */
/* ------------------------------------------------------------------ */
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Comment trouver un logement vérifié avec KeyHome',
  description:
    `${BRAND_TAGLINE}. ` +
    'Marre de perdre du temps avec de fausses annonces ? ' +
    'Voici comment trouver et contacter un vrai propriétaire en moins de 5 minutes sur KeyHome — ' +
    'la méthode la plus sûre pour chercher un logement.',
  totalTime: 'PT5M',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'XOF',
    value: '500',
  },
  supply: [],
  tool: [],
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Créez votre compte gratuitement',
      text:
        'En 30 secondes, créez votre compte KeyHome. Aucune carte bancaire requise. ' +
        'Vous pouvez aussi vous inscrire avec votre compte Google ou Facebook pour aller encore plus vite.',
      url: `${BASE_URL}/register`,
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Recherchez votre logement idéal',
      text:
        'Utilisez la barre de recherche ou la carte interactive pour explorer les annonces par ville, quartier, type de bien et budget. ' +
        'Chaque annonce affiche des photos réelles, le prix, la superficie et la localisation précise. ' +
        'Ajoutez vos coups de cœur en favoris pour les retrouver facilement.',
      url: `${BASE_URL}/search`,
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Débloquez les coordonnées en un clic',
      text:
        'Vous avez trouvé le bien parfait ? Payez un micro-montant sécurisé (à partir de 500 FCFA) via Mobile Money ou carte bancaire. ' +
        'Les coordonnées du propriétaire (téléphone, WhatsApp, email) sont débloquées instantanément et accessibles à tout moment dans votre compte.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Contactez le propriétaire et organisez votre visite',
      text:
        'Appelez, envoyez un WhatsApp ou un mail directement au propriétaire — sans aucun intermédiaire. ' +
        'Organisez votre visite, négociez le prix et emménagez dans votre nouveau chez-vous. ' +
        'Des milliers de personnes ont déjà trouvé leur logement grâce à KeyHome !',
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  7. BreadcrumbList — sitelinks structure in SERPs                  */
/* ------------------------------------------------------------------ */
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: BASE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Rechercher',
      item: `${BASE_URL}/search`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Annonces à proximité',
      item: `${BASE_URL}/nearby`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Inscription gratuite',
      item: `${BASE_URL}/register`,
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  All schemas combined                                              */
/* ------------------------------------------------------------------ */
const allSchemas = [
  websiteSchema,
  organizationSchema,
  realEstateAgentSchema,
  softwareApplicationSchema,
  faqPageSchema,
  howToSchema,
  breadcrumbSchema,
];

/**
 * Renders all JSON-LD schema scripts for rich snippets.
 *
 * 7 schemas covering: WebSite, Organization, RealEstateAgent,
 * SoftwareApplication, FAQPage (10 questions), HowTo, BreadcrumbList.
 */
export default function JsonLd(): React.JSX.Element {
  return (
    <>
      {allSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
