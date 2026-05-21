'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import type { Area } from 'react-easy-crop';
import Cropper from 'react-easy-crop';

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedBlob: Blob) => void;
  accentColor?: string;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

export default function AvatarCropDialog({
  open,
  imageSrc,
  onClose,
  onConfirm,
  accentColor = '#F6475F',
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setApplying(false);
    }
  }, [imageSrc, croppedAreaPixels, onConfirm]);

  const handleClose = useCallback(() => {
    if (applying) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  }, [applying, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="avatar-crop-dialog-title"
      aria-modal
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle
        id="avatar-crop-dialog-title"
        sx={{ fontWeight: 700, pb: 1 }}
      >
        Recadrer la photo
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 280,
            bgcolor: '#111',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </Box>
        <Box sx={{ mt: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_, v) => setZoom(v as number)}
            sx={{ color: accentColor, display: 'block' }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={applying}
          variant="outlined"
          sx={{
            flex: 1,
            borderRadius: 2.5,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={applying || !croppedAreaPixels}
          variant="contained"
          sx={{
            flex: 2,
            borderRadius: 2.5,
            fontWeight: 700,
            textTransform: 'none',
            bgcolor: accentColor,
            '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
          }}
        >
          {applying ? 'Application…' : 'Appliquer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
