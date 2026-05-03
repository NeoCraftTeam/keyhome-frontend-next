declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    readonly scale?: number;
    readonly useCORS?: boolean;
    readonly allowTaint?: boolean;
    readonly logging?: boolean;
    readonly scrollX?: number;
    readonly scrollY?: number;
    readonly windowWidth?: number;
    readonly windowHeight?: number;
    readonly width?: number;
    readonly height?: number;
    readonly x?: number;
    readonly y?: number;
    readonly imageTimeout?: number;
    readonly backgroundColor?: string | null;
    readonly onclone?: (clonedDoc: Document, element: HTMLElement) => void;
  }

  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>;

  export default html2canvas;
}

declare module 'jspdf' {
  export class jsPDF {
    public internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };

    public constructor(options?: Record<string, unknown>);

    public addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: string
    ): void;

    public addPage(): void;

    public output(type: 'blob'): Blob;
  }
}
