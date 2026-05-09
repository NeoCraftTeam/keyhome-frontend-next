import type { JSX } from 'react';

/**
 * Apple touch startup images (iOS PWA splash screens). iOS only supports
 * static PNGs — animated splashes are layered on top by `<PWASplash>` after
 * the very first paint.
 *
 * Each entry's `media` query must match the *device-independent* CSS pixel
 * dimensions of the device, plus its `-webkit-device-pixel-ratio`, otherwise
 * iOS falls back to a white screen.
 */

type SplashEntry = {
  /** Physical pixel size of the asset, e.g. `1170x2532`. */
  size: `${number}x${number}`;
  /** CSS device width in `px`. */
  deviceWidth: number;
  /** CSS device height in `px`. */
  deviceHeight: number;
  /** `-webkit-device-pixel-ratio`. */
  ratio: number;
};

const SPLASH_ENTRIES: readonly SplashEntry[] = [
  // iPhones — portrait
  { size: '640x1136', deviceWidth: 320, deviceHeight: 568, ratio: 2 }, // SE 1
  { size: '750x1334', deviceWidth: 375, deviceHeight: 667, ratio: 2 }, // SE 2/3, 8, 7, 6
  { size: '828x1792', deviceWidth: 414, deviceHeight: 896, ratio: 2 }, // 11, XR
  { size: '1125x2436', deviceWidth: 375, deviceHeight: 812, ratio: 3 }, // 11 Pro, X, XS
  { size: '1170x2532', deviceWidth: 390, deviceHeight: 844, ratio: 3 }, // 14, 13, 12
  { size: '1179x2556', deviceWidth: 393, deviceHeight: 852, ratio: 3 }, // 15, 14 Pro
  { size: '1242x2688', deviceWidth: 414, deviceHeight: 896, ratio: 3 }, // 11 Pro Max, XS Max
  { size: '1284x2778', deviceWidth: 428, deviceHeight: 926, ratio: 3 }, // 14 Plus, 13/12 Pro Max
  { size: '1290x2796', deviceWidth: 430, deviceHeight: 932, ratio: 3 }, // 15 Pro Max
  // iPads — portrait
  { size: '1536x2048', deviceWidth: 768, deviceHeight: 1024, ratio: 2 }, // iPad 9.7
  { size: '1620x2160', deviceWidth: 810, deviceHeight: 1080, ratio: 2 }, // iPad 10.2
  { size: '1668x2388', deviceWidth: 834, deviceHeight: 1194, ratio: 2 }, // iPad Pro 11
  { size: '2048x2732', deviceWidth: 1024, deviceHeight: 1366, ratio: 2 }, // iPad Pro 12.9
] as const;

interface IosSplashLinksProps {
  /** Which panel's splash assets to wire (`/splash/{panel}/...`). */
  panel: 'client' | 'owner';
}

export default function IosSplashLinks({
  panel,
}: IosSplashLinksProps): JSX.Element {
  return (
    <>
      {SPLASH_ENTRIES.map(({ size, deviceWidth, deviceHeight, ratio }) => (
        <link
          key={`${panel}-${size}`}
          rel="apple-touch-startup-image"
          href={`/splash/${panel}/apple-splash-${size}.png`}
          media={`(device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`}
        />
      ))}
    </>
  );
}
