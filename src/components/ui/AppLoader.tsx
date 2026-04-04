'use client';

import { Box } from '@mui/material';
import { brand } from '@/theme/tokens';

/**
 * App-branded spinner using the loading.svg animation.
 *
 * @param size     - Width/height in px (default 48)
 * @param fullPage - When true, centres the loader over the full viewport
 * @param color    - Fill colour for the bars (defaults to customer primary #F6475F).
 *                   Pass `brandAgent.primary` (#0D9488) for the owner panel.
 */
export default function AppLoader({
  size = 64,
  fullPage = false,
  color = brand.primary,
}: {
  size?: number;
  fullPage?: boolean;
  /** Spinner fill colour — defaults to customer brand primary (red). */
  color?: string;
}) {
  const spinner = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Inline SVG — colour is controlled by the `color` prop */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-label="Chargement…"
        role="img"
      >
        <g transform="translate(0, 0)">
          <g className="nc-loop-bars-anim-3-icon-f">
            <path d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z" fill={color} />
            <path
              d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z"
              fill={color}
              opacity="0.7"
            />
            <path
              d="M59,35H5a3,3,0,0,1,0-6H59a3,3,0,0,1,0,6Z"
              fill={color}
              opacity="0.4"
            />
          </g>
          <style>{`
            .nc-loop-bars-anim-3-icon-f,
            .nc-loop-bars-anim-3-icon-f > * {
              --animation-duration: 1.5s;
              transform-origin: 50% 50%;
            }
            .nc-loop-bars-anim-3-icon-f {
              animation: nc-loop-bars-anim-3 var(--animation-duration) infinite cubic-bezier(.65,.05,.36,1);
            }
            .nc-loop-bars-anim-3-icon-f > :nth-child(1) {
              animation: nc-loop-bars-anim-3-sub-1 var(--animation-duration) infinite linear;
            }
            .nc-loop-bars-anim-3-icon-f > :nth-child(2) {
              animation: nc-loop-bars-anim-3-sub-2 var(--animation-duration) infinite linear;
            }
            .nc-loop-bars-anim-3-icon-f > :nth-child(3) {
              animation: nc-loop-bars-anim-3-sub-3 var(--animation-duration) infinite linear;
            }
            @keyframes nc-loop-bars-anim-3 {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(420deg); }
            }
            @keyframes nc-loop-bars-anim-3-sub-1 {
              0%, 10%  { transform: rotate(0deg); }
              30%, 100% { transform: rotate(120deg); }
            }
            @keyframes nc-loop-bars-anim-3-sub-2 {
              0%, 10%  { transform: rotate(0deg); }
              30%, 70% { transform: rotate(60deg); }
              100%     { transform: rotate(120deg); }
            }
            @keyframes nc-loop-bars-anim-3-sub-3 {
              0%, 70% { transform: rotate(0deg); }
              100%    { transform: rotate(120deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              .nc-loop-bars-anim-3-icon-f,
              .nc-loop-bars-anim-3-icon-f > * {
                animation: none !important;
              }
            }
          `}</style>
        </g>
      </svg>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          zIndex: 9999,
        }}
      >
        {spinner}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      {spinner}
    </Box>
  );
}
