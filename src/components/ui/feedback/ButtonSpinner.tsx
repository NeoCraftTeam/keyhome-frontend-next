'use client';

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface ButtonSpinnerProps {
  /** Diamètre en px (carré). 20 par défaut, calé sur la hauteur de texte d'un bouton. */
  size?: number;
  /** Couleur des barres. `inherit` (défaut) → suit la couleur de texte du bouton (blanc sur un bouton `contained`). */
  color?: string;
  sx?: SxProps<Theme>;
}

/**
 * Loader de bouton de validation — reprend l'animation « 3 barres » de
 * `public/loading.svg` mais inline en SVG `currentColor`, donc rendu dans la
 * couleur de texte du bouton (blanc sur un bouton plein, teinte primaire sur
 * un bouton texte/outlined) et cohérent avec le thème clair/sombre. Purement
 * décoratif : `aria-hidden`, le libellé « … en cours » porte l'information.
 */
export default function ButtonSpinner({
  size = 20,
  color = 'inherit',
  sx,
}: ButtonSpinnerProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      sx={{ color, display: 'block', flexShrink: 0, ...sx }}
    >
      <g className="nc-loop-bars-anim-3-icon-f">
        <path
          d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z"
          fill="currentColor"
        />
        <path
          d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z"
          fill="currentColor"
          opacity={0.7}
        />
        <path
          d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z"
          fill="currentColor"
          opacity={0.4}
        />
      </g>
      <style>{`.nc-loop-bars-anim-3-icon-f,.nc-loop-bars-anim-3-icon-f>*{--animation-duration:1.5s;transform-origin:50% 50%}.nc-loop-bars-anim-3-icon-f{animation:nc-loop-bars-anim-3 var(--animation-duration) infinite cubic-bezier(.65,.05,.36,1)}.nc-loop-bars-anim-3-icon-f>:nth-child(1){animation:nc-loop-bars-anim-3-sub-1 var(--animation-duration) infinite linear}.nc-loop-bars-anim-3-icon-f>:nth-child(2){animation:nc-loop-bars-anim-3-sub-2 var(--animation-duration) infinite linear}.nc-loop-bars-anim-3-icon-f>:nth-child(3){animation:nc-loop-bars-anim-3-sub-3 var(--animation-duration) infinite linear}@keyframes nc-loop-bars-anim-3{0%{transform:rotate(0)}100%{transform:rotate(420deg)}}@keyframes nc-loop-bars-anim-3-sub-1{0%,10%{transform:rotate(0)}100%,30%{transform:rotate(120deg)}}@keyframes nc-loop-bars-anim-3-sub-2{0%,10%{transform:rotate(0)}30%,70%{transform:rotate(60deg)}100%{transform:rotate(120deg)}}@keyframes nc-loop-bars-anim-3-sub-3{0%,70%{transform:rotate(0)}100%{transform:rotate(120deg)}}`}</style>
    </Box>
  );
}
