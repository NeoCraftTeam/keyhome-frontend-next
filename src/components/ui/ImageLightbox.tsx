'use client';

import type { AdImage } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Close,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
} from '@mui/icons-material';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  images: AdImage[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function ImageLightbox({ images, open, initialIndex = 0, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [zoom, setZoom] = useState(1);
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setDirection(0);
      setZoom(1);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (thumbsRef.current) {
      const activeThumb = thumbsRef.current.querySelector('[data-active="true"]');
      activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  const navigate = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= images.length) { return; }
      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
      setZoom(1);
    },
    [currentIndex, images.length],
  );

  const goPrev = useCallback(() => {
    navigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, navigate]);

  const goNext = useCallback(() => {
    navigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
          break;
        case '-':
          setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
          break;
      }
    },
    [goPrev, goNext, onClose],
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (zoom > 1) { return; }
      if (info.offset.x > SWIPE_THRESHOLD) {
        goPrev();
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        goNext();
      }
    },
    [zoom, goPrev, goNext],
  );

  if (!images.length) { return null; }

  const image = images[currentIndex];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      onKeyDown={handleKeyDown}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.96)' } } }}
      PaperProps={{
        sx: {
          bgcolor: '#000',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Top bar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 1, sm: 2 },
          py: 0.75,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label="Fermer"
          onClick={onClose}
          sx={{ color: '#fff' }}
        >
          <Close />
        </IconButton>

        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: 0.5 }}
        >
          {currentIndex + 1} / {images.length}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            aria-label="Dézoomer"
            onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
            disabled={zoom <= 0.5}
            sx={{ color: '#fff', opacity: zoom <= 0.5 ? 0.3 : 1 }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ color: '#fff', minWidth: 32, textAlign: 'center', userSelect: 'none', fontSize: '0.7rem' }}
          >
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton
            size="small"
            aria-label="Zoomer"
            onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
            disabled={zoom >= 4}
            sx={{ color: '#fff', opacity: zoom >= 4 ? 0.3 : 1 }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setZoom(1)}
            aria-label="Réinitialiser le zoom"
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <ZoomOutMap sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Main image area ── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          touchAction: zoom > 1 ? 'none' : 'pan-y',
        }}
      >
        {/* Prev button */}
        {images.length > 1 && (
          <IconButton
            aria-label="Photo précédente"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            sx={{
              color: '#fff',
              position: 'absolute',
              left: { xs: 4, sm: 20 },
              zIndex: 5,
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <ChevronLeft sx={{ fontSize: 28 }} />
          </IconButton>
        )}

        {/* Animated image */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={zoom <= 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (zoom < 3) {
                setZoom((z) => parseFloat((z + 0.5).toFixed(2)));
              } else {
                setZoom(1);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              cursor: zoom >= 3 ? 'zoom-out' : 'zoom-in',
            }}
          >
            {image && (
              <Box
                component="img"
                src={image.url}
                alt={`Photo ${currentIndex + 1}`}
                draggable={false}
                sx={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 140px)',
                  objectFit: 'contain',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                  borderRadius: zoom <= 1 ? 1 : 0,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        {images.length > 1 && (
          <IconButton
            aria-label="Photo suivante"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            sx={{
              color: '#fff',
              position: 'absolute',
              right: { xs: 4, sm: 20 },
              zIndex: 5,
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <ChevronRight sx={{ fontSize: 28 }} />
          </IconButton>
        )}
      </Box>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <Box
          ref={thumbsRef}
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: { xs: 1, sm: 3 },
            py: 1.5,
            bgcolor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            justifyContent: 'center',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {images.map((img, idx) => (
            <Box
              key={img.id}
              data-active={idx === currentIndex}
              onClick={() => navigate(idx)}
              sx={{
                width: { xs: 48, sm: 64 },
                height: { xs: 36, sm: 48 },
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: idx === currentIndex ? '#fff' : 'transparent',
                opacity: idx === currentIndex ? 1 : 0.5,
                transition: 'all 0.2s ease',
                '&:hover': { opacity: 0.85 },
              }}
            >
              <Box
                component="img"
                src={img.thumb || img.medium || img.url}
                alt={`Miniature ${idx + 1}`}
                draggable={false}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
}
