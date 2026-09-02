/**
 * Vocabulaire d'animation de la landing — source unique.
 *
 * Chaque section déclarait auparavant sa propre constante `EASE` (dix copies
 * de la même courbe) : la moindre correction de rythme devait être répétée
 * partout, et les valeurs avaient déjà commencé à diverger. Tout passe
 * désormais par ce module.
 *
 * `EASE_OUT` reprend exactement `--ease-out` de `globals.css`, si bien qu'une
 * transition CSS et une animation framer-motion voisines partagent la même
 * courbe — sans quoi deux éléments côte à côte n'arrivent pas ensemble.
 */

import type { TargetAndTransition, Transition, Variants } from 'framer-motion';

/**
 * Sortie forte : démarre immédiatement, arrive amortie. Convient aux entrées
 * comme aux sorties — une courbe `ease-in` ferait paraître l'interface lente
 * puisqu'elle retarde le mouvement au moment précis où l'œil regarde.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Déplacement/morphing d'un élément déjà à l'écran (accélère puis freine). */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as [
  number,
  number,
  number,
  number,
];

/**
 * Fondu d'ambiance : arrière-plan du hero, diaporama de secours.
 *
 * Volontairement la courbe douce du navigateur et non `EASE_IN_OUT` : sur un
 * fondu de plus d'une seconde couvrant tout l'écran, la courbe forte fait
 * « claquer » le milieu du mouvement et attire l'œil loin du titre. Un décor
 * doit dériver sans qu'on le remarque.
 */
export const EASE_AMBIENT = 'easeInOut' as const;

/**
 * Durées en secondes (unité de framer-motion).
 *
 * `exit` est volontairement plus courte que `enter` : ce qui disparaît ne doit
 * pas se faire attendre. `reveal` sert aux blocs éditoriaux, vus une fois.
 */
export const DURATION = {
  press: 0.16,
  hover: 0.22,
  exit: 0.18,
  enter: 0.28,
  reveal: 0.55,
  /** Fondu de décor (clips du hero, diaporama de secours). */
  ambient: 1.2,
} as const;

/** Retour de pression standard de la landing, identique sur tout élément cliquable. */
export const PRESS = { scale: 0.97 } as const;

/**
 * Pression d'une surface pleine largeur (ligne d'accordéon, carte étirée).
 * `0.97` sur une ligne de 780 px la fait reculer de 23 px : le texte semble
 * sauter au lieu de répondre. Le retour doit rester perceptible sans déplacer
 * la ligne que l'œil est en train de lire.
 */
export const PRESS_WIDE = { scale: 0.99 } as const;

/**
 * Révélation au défilement. `once: true` : le pied de page et les sections ne
 * rejouent jamais leur entrée quand on remonte la page — un bloc qui
 * réapparaît à chaque passage devient une distraction, pas une information.
 * La marge négative déclenche l'animation avant que le bloc ne soit centré.
 */
export const REVEAL_VIEWPORT = { once: true, margin: '-80px' } as const;

/**
 * Conteneur en cascade : les enfants portant `REVEAL_ITEM` s'enchaînent au
 * lieu d'apparaître d'un bloc. 60 ms suffisent à faire lire l'ordre de
 * lecture ; au-delà, la dernière carte se fait attendre.
 */
export function staggerContainer(stagger = 0.06): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };
}

/** Élément révélé : jamais depuis `scale(0)` — rien n'apparaît de nulle part. */
export const REVEAL_ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE_OUT },
  },
};

/**
 * En-tête de section (badge + titre + chapô), à étaler sur le `motion.div`.
 *
 * Huit sections répétaient ce même geste avec des valeurs déjà divergentes —
 * 0,7 / 0,65 / 0,6 s et des marges de déclenchement de -80 / -60 / -40 px : en
 * descendant la page, le même mouvement ne se jouait pas deux fois au même
 * rythme. Le déplacement reste plus ample que celui d'un `REVEAL_ITEM` (24 px
 * contre 14) : un titre porte plus loin qu'une carte d'une liste.
 */
export const REVEAL_HEADER: {
  initial: TargetAndTransition;
  whileInView: TargetAndTransition;
  viewport: typeof REVEAL_VIEWPORT;
  transition: Transition;
} = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: REVEAL_VIEWPORT,
  transition: { duration: DURATION.reveal, ease: EASE_OUT },
};
