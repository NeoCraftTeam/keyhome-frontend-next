/**
 * Captures the ad detail print root (#kh-ad-print-root) and opens a multi-page PDF
 * in a new tab so the user can print or save (browser print dialog).
 */

import type { jsPDF } from 'jspdf';

const PRINT_ROOT_ID = 'kh-ad-print-root';

function prepareAdPrintClone(clonedDoc: Document): void {
  const root = clonedDoc.getElementById(PRINT_ROOT_ID);
  if (!root) {
    return;
  }

  const rootEl = root as HTMLElement;
  rootEl.style.overflow = 'visible';
  rootEl.style.overflowX = 'visible';
  rootEl.style.overflowY = 'visible';
  rootEl.style.height = 'auto';
  rootEl.style.maxHeight = 'none';

  const win = clonedDoc.defaultView;
  if (!win) {
    return;
  }

  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = win.getComputedStyle(el);
    const ox = cs.overflowX;
    const oy = cs.overflowY;

    if (ox === 'hidden' || ox === 'clip') {
      el.style.overflowX = 'visible';
    }
    if (oy === 'hidden' || oy === 'clip') {
      el.style.overflowY = 'visible';
    }

    if (oy === 'auto' || oy === 'scroll') {
      if (el.scrollHeight > el.clientHeight + 2) {
        el.style.overflowY = 'visible';
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
      }
    }

    if (
      cs.maxHeight !== 'none' &&
      (cs.maxHeight.includes('vh') || cs.maxHeight.includes('%'))
    ) {
      el.style.maxHeight = 'none';
    }
  });

  root.querySelectorAll('img').forEach((node) => {
    const img = node as HTMLImageElement;
    img.removeAttribute('loading');
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (nw > 0 && nh > 0) {
      const w = Math.min(nw, 1400);
      const h = (nh / nw) * w;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      img.style.maxWidth = '100%';
    }
    img.style.objectFit = 'contain';
  });

  root.querySelectorAll('.kh-ad-print-hero-mobile').forEach((node) => {
    const wrap = node as HTMLElement;
    wrap.style.overflow = 'visible';
    wrap.style.maxHeight = 'none';
    const img = wrap.querySelector('img');
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const targetW = Math.min(nw, 1200);
      const pxH = Math.max((nh / nw) * targetW, 320);
      wrap.style.height = `${pxH}px`;
      wrap.style.minHeight = `${pxH}px`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
    }
  });
}

export interface AdDetailPrintPdfOptions {
  /** File name hint when the user saves from the browser PDF viewer */
  filenameSlug?: string;
  onProgress?: (phase: 'capture' | 'pdf') => void;
}

function addImagePages(
  pdf: jsPDF,
  imgData: string,
  canvasWidth: number,
  canvasHeight: number
): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvasHeight * imgW) / canvasWidth;
  let y = 0;
  let remaining = imgH;

  pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH, undefined, 'FAST');
  remaining -= pageH;

  while (remaining > 1) {
    y -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH, undefined, 'FAST');
    remaining -= pageH;
  }
}

export async function openAdDetailPrintPdf(
  options: AdDetailPrintPdfOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const root = document.getElementById(PRINT_ROOT_ID);
  if (!root) {
    throw new Error("Contenu d'annonce introuvable pour l'export.");
  }

  options.onProgress?.('capture');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  await document.fonts.ready.catch(() => undefined);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const captureW = Math.max(root.scrollWidth, root.clientWidth);
  const captureH = Math.max(root.scrollHeight, root.offsetHeight);

  const canvas = await html2canvas(root, {
    scale: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: captureW,
    windowHeight: captureH,
    imageTimeout: 20_000,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      prepareAdPrintClone(clonedDoc);
    },
  });

  options.onProgress?.('pdf');
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  addImagePages(pdf, imgData, canvas.width, canvas.height);

  const slug = options.filenameSlug?.replace(/[^\w\-]+/g, '_').slice(0, 80);
  const fname = slug ? `KeyHome-${slug}.pdf` : 'KeyHome-annonce.pdf';
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    requestAnimationFrame(() => {
      w.onload = (): void => {
        URL.revokeObjectURL(url);
      };
    });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
