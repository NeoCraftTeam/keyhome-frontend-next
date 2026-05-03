import type { Ad } from '@/types';

/**
 * Attributs volontairement exclus du comparateur (granularité type hôtellerie / airbnb).
 * Clés alignées avec {@link ATTRIBUTE_LABELS} dans `attribute-labels.ts`.
 */
export const COMPARATOR_ATTRIBUTE_EXCLUDED_SLUGS = new Set([
  'baignoire',
  'baignoire-bebe',
  'cabine-de-douche-separee',
  'couette',
  'cuisine-equipee',
  'detecteur-de-fumee',
  'digicode-badge',
  'fer-a-repasser',
  'lave-linge',
  'linge-de-lit',
  'miroir',
  'plaques-de-cuisson',
  'refrigerateur',
  'seche-linge',
  'serrure-connectee',
  'tapis',
  'trousse-de-premiers-secours',
  'vinyl-tourne-disque',
]);

/**
 * Attributs affichés dans le comparateur, dans cet ordre (si au moins une annonce les porte).
 * Hors de cette liste → jamais affichés (évite les dizaines de lignes « équipement »).
 */
export const COMPARATOR_ATTRIBUTE_ALLOWLIST: readonly string[] = [
  'terrasse',
  'balcon',
  'jardin-privatif',
  'jardin-commun',
  'piscine-privee',
  'piscine-commune',
  'jacuzzi',
  'sauna',
  'vue-sur-mer',
  'vue-sur-montagne',
  'vue-sur-jardin',
  'acces-plage',
  'barbecue',
  'mobilier-de-jardin',
  'ascenseur',
  'acces-pmr',
  'personnes-a-mobilite-reduite',
  'entree-privee',
  'parking-prive',
  'parking-gratuit',
  'parking-payant',
  'garage',
  'place-de-velo',
  'borne-de-recharge-ve',
  'dans-la-rue',
  'climatisation',
  'climatisation-reversible',
  'chaud-et-froid',
  'chauffage-central',
  'radiateurs-electriques',
  'cheminee',
  'poele-a-bois',
  'ventilateur',
  'thermostat',
  'eau-chaude',
  'douche',
  'wifi',
  'wifi-haut-debit',
  'wifi-fibre',
  '100-mbs',
  'ethernet-port-reseau',
  'espace-de-travail-dedie',
  'television',
  'tv-hd',
  '4k-full-hd',
  'tv-connectee',
  'netflix-prime-youtube',
  'acces-netflix',
  'enceinte-bluetooth',
  'interphone-visiophone',
  'camera-de-securite',
  'alarme',
  'extincteur',
  'coffre-fort',
  'gardien-concierge',
  'detecteur-de-co',
  'monoxyde-de-carbone',
  'animaux-acceptes',
  'lit-bebe-disponible',
  'lit-bebe-berceau',
  'chaise-haute',
  'aire-de-jeux',
  'jouets-enfants',
  'buanderie-commune',
  'etendoir-a-linge',
  'lessive-fournie',
  'lave-vaisselle',
  'four',
  'micro-ondes',
  'hotte-aspirante',
  'furnished',
  'air_conditioning',
  'pool',
  'garden',
  'balcony',
  'terrace',
  'elevator',
  'security',
  'gym',
  'fireplace',
  'dishwasher',
  'tv',
  'accessibility',
  'pets_allowed',
  'smoking_allowed',
  'storage',
  'laundry',
  'heating',
];

/**
 * Slugs d’attributs à montrer pour ce jeu d’annonces : allowlist ∩ (union des attributs), ordre produit.
 */
export function getComparatorAttributeSlugsForAds(ads: Ad[]): string[] {
  const present = new Set(
    ads
      .flatMap((ad) => ad.attributes ?? [])
      .map((s) => s.toLowerCase().trim())
      .filter(
        (s) => s.length > 0 && !COMPARATOR_ATTRIBUTE_EXCLUDED_SLUGS.has(s)
      )
  );

  return COMPARATOR_ATTRIBUTE_ALLOWLIST.filter((slug) => present.has(slug));
}
