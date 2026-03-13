/**
 * Minimal type shim for the Pannellum library loaded via CDN.
 * Only the API surface used by TourViewer.tsx is declared here.
 */
export interface PannellumHotspot {
  type: 'scene' | 'info' | 'custom';
  pitch: number;
  yaw: number;
  sceneId?: string;
  text?: string;
  cssClass?: string;
  createTooltipFunc?: (hotSpotDiv: HTMLDivElement, args?: { text?: string }) => void;
  createTooltipArgs?: { text?: string };
}

export interface PannellumMultiResConfig {
  basePath: string;
  path: string;
  fallbackPath?: string;
  extension: string;
  tileResolution: number;
  maxLevel: number;
  cubeResolution: number;
}

export type PannellumSceneConfig =
  | {
      title?: string;
      type: 'equirectangular';
      panorama: string;
      pitch?: number;
      yaw?: number;
      hfov?: number;
      haov?: number;
      vaov?: number;
      vOffset?: number;
      minPitch?: number;
      maxPitch?: number;
      minHfov?: number;
      maxHfov?: number;
      hotSpots?: PannellumHotspot[];
    }
  | {
      title?: string;
      type: 'cubemap';
      cubeMap: string[];
      pitch?: number;
      yaw?: number;
      hfov?: number;
      hotSpots?: PannellumHotspot[];
    }
  | {
      title?: string;
      type: 'multires';
      multiRes: PannellumMultiResConfig;
      pitch?: number;
      yaw?: number;
      hfov?: number;
      hotSpots?: PannellumHotspot[];
    };

export interface PannellumConfig {
  default: {
    firstScene: string;
    sceneFadeDuration?: number;
    autoLoad?: boolean;
    showControls?: boolean;
    compass?: boolean;
    hfov?: number;
  };
  scenes: Record<string, PannellumSceneConfig>;
}

export interface PannellumViewer {
  destroy(): void;
  loadScene(sceneId: string, pitch?: number, yaw?: number, hfov?: number): void;
  getScene(): string;
  on(event: string, callback: () => void): void;
}

export interface Pannellum {
  viewer(container: HTMLElement, config: PannellumConfig): PannellumViewer;
}
