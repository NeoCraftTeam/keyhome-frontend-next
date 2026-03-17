/**
 * Libellés des attributs immobiliers pour le tableau comparatif.
 * Aligné avec le catalogue backend (PropertyAttributeCatalog).
 */
export const ATTRIBUTE_LABELS: Record<string, string> = {
  // Salle de bain
  'produits-de-nettoyage': 'Produits de nettoyage',
  'savon-pour-le-corps': 'Savon pour le corps',
  'eau-chaude': 'Eau chaude',
  baignoire: 'Baignoire',
  douche: 'Douche',
  'cabine-de-douche-separee': 'Cabine de douche séparée',
  'seche-cheveux': 'Sèche-cheveux',
  'serviettes-de-bain': 'Serviettes de bain',
  'gel-douche': 'Gel douche',
  shampooing: 'Shampoing',
  conditionneur: 'Conditionneur',
  'papier-toilette': 'Papier toilette',
  miroir: 'Miroir',
  'pese-personne': 'Pèse-personne',

  // Chambre et linge
  'linge-de-lit': 'Linge de lit',
  'draps-et-taies-doreiller': "Draps et taies d'oreiller",
  oreillers: 'Oreillers',
  couvertures: 'Couvertures',
  couette: 'Couette',
  cintres: 'Cintres',
  'stores-occultants': 'Stores occultants',
  'fer-a-repasser': 'Fer à repasser',
  'planche-a-repasser': 'Planche à repasser',
  'armoire-dressing': 'Armoire / Dressing',
  'lit-bebe-berceau': 'Lit bébé / Berceau',
  reveil: 'Réveil',
  'coussins-decoratifs': 'Coussins décoratifs',

  // Cuisine
  'cuisine-equipee': 'Cuisine équipée',
  refrigerateur: 'Réfrigérateur',
  congelateur: 'Congélateur',
  four: 'Four',
  'micro-ondes': 'Micro-ondes',
  'lave-vaisselle': 'Lave-vaisselle',
  cafetiere: 'Cafetière',
  'machine-a-expresso': 'Machine à expresso',
  bouilloire: 'Bouilloire',
  'grille-pain': 'Grille-pain',
  'mixeur-blender': 'Mixeur / Blender',
  'ustensiles-de-cuisine': 'Ustensiles de cuisine',
  'casseroles-poele-couteaux': 'Casseroles, poêles, couteaux',
  vaisselle: 'Vaisselle',
  'assiettes-verres-couverts': 'Assiettes, verres, couverts',
  'plaques-de-cuisson': 'Plaques de cuisson',
  'hotte-aspirante': 'Hotte aspirante',
  'epices-et-condiments': 'Épices et condiments',
  'huile-et-sel': 'Huile et sel',

  // Séjour
  canape: 'Canapé',
  'canape-lit': 'Canapé-lit',
  'table-a-manger': 'Table à manger',
  chaises: 'Chaises',
  bureau: 'Bureau',
  'chaise-de-bureau': 'Chaise de bureau',
  bibliotheque: 'Bibliothèque',
  'jeux-de-societe': 'Jeux de société',
  livres: 'Livres',
  tapis: 'Tapis',

  // Divertissement
  television: 'Télévision',
  'tv-hd': 'TV HD',
  '4k-full-hd': '4K / Full HD',
  'tv-connectee': 'TV connectée',
  'netflix-prime-youtube': 'Netflix, Prime, YouTube',
  'acces-netflix': 'Accès Netflix',
  'acces-spotify': 'Accès Spotify',
  'enceinte-bluetooth': 'Enceinte Bluetooth',
  'console-de-jeux': 'Console de jeux',
  'ps5-xbox-nintendo-switch': 'PS5, Xbox, Nintendo Switch',
  projecteur: 'Projecteur',
  'lecteur-dvd-blu-ray': 'Lecteur DVD / Blu-Ray',
  'vinyl-tourne-disque': 'Vinyl / Tourne-disque',

  // Connectivité
  wifi: 'WiFi',
  'wifi-haut-debit': 'WiFi haut débit',
  '100-mbs': '+100 Mb/s',
  'wifi-fibre': 'WiFi fibre',
  'ethernet-port-reseau': 'Ethernet / Port réseau',
  'espace-de-travail-dedie': 'Espace de travail dédié',
  imprimante: 'Imprimante',

  // Climatisation et chauffage
  climatisation: 'Climatisation',
  'climatisation-reversible': 'Climatisation réversible',
  'chaud-et-froid': 'Chaud et froid',
  'chauffage-central': 'Chauffage central',
  'radiateurs-electriques': 'Radiateurs électriques',
  cheminee: 'Cheminée',
  'poele-a-bois': 'Poêle à bois',
  ventilateur: 'Ventilateur',
  thermostat: 'Thermostat',

  // Sécurité
  'detecteur-de-fumee': 'Détecteur de fumée',
  'detecteur-de-co': 'Détecteur de CO',
  'monoxyde-de-carbone': 'Monoxyde de carbone',
  extincteur: 'Extincteur',
  'trousse-de-premiers-secours': 'Trousse de premiers secours',
  'coffre-fort': 'Coffre-fort',
  'serrure-connectee': 'Serrure connectée',
  'interphone-visiophone': 'Interphone / Visiophone',
  'camera-de-securite': 'Caméra de sécurité',
  'exterieur-uniquement': 'Extérieur uniquement',
  alarme: 'Alarme',
  'gardien-concierge': 'Gardien / Concierge',

  // Extérieur
  terrasse: 'Terrasse',
  balcon: 'Balcon',
  'jardin-privatif': 'Jardin privatif',
  'jardin-commun': 'Jardin commun',
  barbecue: 'Barbecue',
  'mobilier-de-jardin': 'Mobilier de jardin',
  'piscine-privee': 'Piscine privée',
  'piscine-commune': 'Piscine commune',
  jacuzzi: 'Jacuzzi',
  sauna: 'Sauna',
  'vue-sur-mer': 'Vue sur mer',
  'vue-sur-montagne': 'Vue sur montagne',
  'vue-sur-jardin': 'Vue sur jardin',
  'acces-plage': 'Accès plage',

  // Stationnement et accès
  'parking-prive': 'Parking privé',
  'parking-gratuit': 'Parking gratuit',
  'dans-la-rue': 'Dans la rue',
  'parking-payant': 'Parking payant',
  garage: 'Garage',
  'place-de-velo': 'Place de vélo',
  'borne-de-recharge-ve': 'Borne de recharge VE',
  'vehicule-electrique': 'Véhicule électrique',
  ascenseur: 'Ascenseur',
  'acces-pmr': 'Accès PMR',
  'personnes-a-mobilite-reduite': 'Personnes à mobilité réduite',
  'entree-privee': 'Entrée privée',
  'digicode-badge': 'Digicode / Badge',

  // Buanderie
  'lave-linge': 'Lave-linge',
  'seche-linge': 'Sèche-linge',
  'lessive-fournie': 'Lessive fournie',
  'etendoir-a-linge': 'Étendoir à linge',
  'buanderie-commune': 'Buanderie commune',

  // Animaux et famille
  'animaux-acceptes': 'Animaux acceptés',
  'lit-bebe-disponible': 'Lit bébé disponible',
  'chaise-haute': 'Chaise haute',
  'baignoire-bebe': 'Baignoire bébé',
  'jouets-enfants': 'Jouets enfants',
  'aire-de-jeux': 'Aire de jeux',


  // Anciens attributs (legacy)
  air_conditioning: 'Climatisation',
  furnished: 'Meublé',
  pool: 'Piscine',
  garden: 'Jardin',
  elevator: 'Ascenseur',
  security: 'Sécurité',
  gym: 'Salle de sport',
};

const slugRegex = /[^a-z0-9]+/g;

export function getAttributeLabel(slug: string): string {
  const normalized = slug.toLowerCase().trim();
  return ATTRIBUTE_LABELS[normalized] ?? slug.replace(slugRegex, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
