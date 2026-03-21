/**
 * Helpers for Photo Sphere Viewer "cropped" equirectangular panoData.
 * Reduces black poles / sides when the JPEG is not a true 360×180° strip (~2:1).
 */

export type EquirectPanoDataRect = {
  fullWidth: number;
  fullHeight: number;
  croppedWidth: number;
  croppedHeight: number;
  croppedX: number;
  croppedY: number;
};

export function buildPanoDataFromAngles(
  haovDeg: number,
  vaovDeg: number,
  vOffDeg: number,
): EquirectPanoDataRect {
  const fullWidth = 4000;
  const fullHeight = fullWidth / 2;
  const croppedWidth = Math.round(fullWidth * (haovDeg / 360));
  const croppedHeight = Math.round(fullHeight * (vaovDeg / 180));
  const croppedX = Math.round((fullWidth - croppedWidth) / 2);
  const croppedY = Math.round(
    (fullHeight - croppedHeight) / 2 - (vOffDeg / 180) * fullHeight,
  );

  return { fullWidth, fullHeight, croppedWidth, croppedHeight, croppedX, croppedY };
}

/**
 * Infer partial coverage from pixel size. Returns undefined only for ~true 2:1 full equirectangulars.
 *
 * - ratio > 2: wide strip (souvent panoramique téléphone) → vaov < 180
 * - ratio < 2: plus haut que 2:1 (bandes / export atypique) → vaov et parfois haov réduits
 */
export function inferPanoDataFromImageSize(
  w: number,
  h: number,
): EquirectPanoDataRect | undefined {
  if (w <= 0 || h <= 0) {
    return undefined;
  }

  const ratio = w / h;

  if (Math.abs(ratio - 2) <= 0.015) {
    return undefined;
  }

  const expectedHeight = w / 2;
  let effHaov = 360;
  let effVaov = 180;

  if (ratio > 2 + 0.015) {
    effVaov = Math.min(180, (h / expectedHeight) * 180);
    effHaov = 360;
  } else {
    effVaov = Math.min(180, (expectedHeight / h) * 180);
    effHaov = Math.min(360, (w / (2 * h)) * 360);
  }

  const minVaov = 45;
  const minHaov = 90;
  effVaov = Math.max(minVaov, Math.round(effVaov * 10000) / 10000);
  effHaov = Math.max(minHaov, Math.round(effHaov * 10000) / 10000);

  if (effVaov >= 177 && effHaov >= 355) {
    return undefined;
  }

  return buildPanoDataFromAngles(effHaov, effVaov, 0);
}
