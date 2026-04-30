'use client';

import type { MessageAttachment } from '@/types/chat';
import { FileText, X, Download, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  isOwn: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Renders an image inline (with lightbox on click) or a document as a download card.
 */
export function AttachmentPreview({
  attachment,
  isOwn,
}: AttachmentPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  if (attachment.type === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F6475F]"
          style={{
            // Cap inside the 75% bubble across all viewports.
            maxWidth: 'min(280px, 70vw)',
            maxHeight: 280,
            width: 'fit-content',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          aria-label="Agrandir l'image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.signed_url}
            alt={attachment.original_name}
            loading="lazy"
            decoding="async"
            className="block rounded-xl transition-opacity group-hover:opacity-90"
            style={{
              maxWidth: '100%',
              maxHeight: 280,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
            <ZoomIn className="h-6 w-6 text-white drop-shadow" />
          </span>
        </button>

        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal
            aria-label="Visionneuse d'image"
          >
            <div
              className="relative max-w-[92vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={attachment.signed_url}
                alt={attachment.original_name}
                className="max-w-[92vw] max-h-[85vh] rounded-lg object-contain shadow-2xl"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <a
                  href={attachment.signed_url}
                  download={attachment.original_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                  aria-label="Télécharger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-white/60 truncate max-w-[92vw]">
                {attachment.original_name}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <a
      href={attachment.signed_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-opacity hover:opacity-80 ${
        isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
      }`}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-medium">{attachment.original_name}</p>
        <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
          {formatBytes(attachment.size)}
        </p>
      </div>
    </a>
  );
}
