/**
 * Clamp Photo Sphere Viewer pitch so the viewport stays over textured equirectangular
 * pixels (avoids black “poles” on phone / partial panoramas).
 *
 * Uses the same spherical ↔ crop mapping as {@link EquirectangularAdapter} in PSV v5.
 */

import type { PanoData, Viewer } from '@photo-sphere-viewer/core';

/** PSV fires these events with modifiable `position` (radians); classes are not exported from the package root. */
type PsvBeforeRotateEvent = { position: { yaw: number; pitch: number } };
type PsvBeforeAnimateEvent = { position?: { yaw: number; pitch: number } };
import { MathUtils } from 'three';

const RAD_PAD = 0.035;

/**
 * Spherical pitch bounds (radians) implied by the cropped region in panoData.
 * Returns null when vertical coverage is effectively the full 180° strip (no extra clamp).
 */
export function getEquirectVerticalPitchLimitsRad(
  panoData: PanoData | null | undefined
): { min: number; max: number } | null {
  if (!panoData?.fullWidth) {
    return null;
  }

  const fullHeight = panoData.fullHeight ?? panoData.fullWidth / 2;
  const croppedY = panoData.croppedY ?? 0;
  const croppedHeight = panoData.croppedHeight ?? fullHeight;

  if (croppedHeight >= fullHeight * 0.99 && croppedY <= fullHeight * 0.01) {
    return null;
  }

  const pitchTop = Math.PI / 2 - (croppedY / fullHeight) * Math.PI;
  const pitchBottom =
    Math.PI / 2 - ((croppedY + croppedHeight) / fullHeight) * Math.PI;

  return { min: pitchBottom, max: pitchTop };
}

/**
 * Narrows the allowed pitch using half the current vertical FOV so frustum edges
 * stay inside the textured band.
 */
export function clampViewerPitchToPanoContent(
  viewer: Pick<Viewer, 'state'>,
  position: { pitch: number }
): void {
  const limits = getEquirectVerticalPitchLimitsRad(
    viewer.state.textureData?.panoData
  );
  if (!limits) {
    return;
  }

  const halfFov = MathUtils.degToRad(viewer.state.vFov) / 2;
  const minP = limits.min + halfFov + RAD_PAD;
  const maxP = limits.max - halfFov - RAD_PAD;

  if (minP > maxP) {
    position.pitch = (limits.min + limits.max) / 2;

    return;
  }

  position.pitch = MathUtils.clamp(position.pitch, minP, maxP);
}

/**
 * Registers PSV listeners; call the returned function before {@link Viewer.destroy}.
 */
export function attachPartialPanoPitchClamp(viewer: Viewer): () => void {
  const onBeforeRotate = (e: PsvBeforeRotateEvent) => {
    clampViewerPitchToPanoContent(viewer, e.position);
  };

  const onBeforeAnimate = (e: PsvBeforeAnimateEvent) => {
    if (e.position) {
      clampViewerPitchToPanoContent(viewer, e.position);
    }
  };

  const onZoomUpdated = () => {
    const pos = viewer.getPosition();
    const next = { yaw: pos.yaw, pitch: pos.pitch };
    clampViewerPitchToPanoContent(viewer, next);
    if (next.pitch !== pos.pitch) {
      viewer.rotate({ yaw: pos.yaw, pitch: next.pitch });
    }
  };

  viewer.addEventListener(
    'before-rotate',
    onBeforeRotate as (e: unknown) => void
  );
  viewer.addEventListener(
    'before-animate',
    onBeforeAnimate as (e: unknown) => void
  );
  viewer.addEventListener('zoom-updated', onZoomUpdated);

  return () => {
    viewer.removeEventListener(
      'before-rotate',
      onBeforeRotate as (e: unknown) => void
    );
    viewer.removeEventListener(
      'before-animate',
      onBeforeAnimate as (e: unknown) => void
    );
    viewer.removeEventListener('zoom-updated', onZoomUpdated);
  };
}
