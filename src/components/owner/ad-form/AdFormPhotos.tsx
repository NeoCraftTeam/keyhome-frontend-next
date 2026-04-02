import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import type { AdImage } from '@/types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormPhotosProps {
  imagePreviewUrls: string[];
  existingImages?: AdImage[];
  imagesToDelete: number[];
  imageCount: number;
  adTitle?: string;
  errors: Record<string, string>;
  /** True while images are being compressed client-side — disables the upload controls. */
  isCompressing?: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onDeleteExistingImage: (imageId: number) => void;
  onOpenLightbox: (index: number) => void;
}

export default function AdFormPhotos({
  imagePreviewUrls,
  existingImages,
  imagesToDelete,
  imageCount,
  adTitle,
  errors,
  isCompressing = false,
  onImageChange,
  onRemoveImage,
  onDeleteExistingImage,
  onOpenLightbox,
}: AdFormPhotosProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visibleExisting = existingImages?.filter(
    (img) => !imagesToDelete.includes(img.id)
  );
  const totalCount = imageCount + (visibleExisting?.length ?? 0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files.length || !fileInputRef.current) {
      return;
    }
    const dt = new DataTransfer();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    for (let i = 0; i < files.length; i++) {
      if (allowedTypes.includes(files[i].type)) {
        dt.items.add(files[i]);
      }
    }
    if (dt.files.length > 0) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(
        new Event('change', { bubbles: true })
      );
    }
  }, []);

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography
        variant="subtitle1"
        sx={{
          ...sectionTitleSx,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <PhotoCameraIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Photos du bien
        {isCompressing ? (
          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <CircularProgress size={14} />
            <Typography
              component="span"
              variant="caption"
              color="primary.main"
              fontWeight={600}
            >
              Optimisation…
            </Typography>
          </Box>
        ) : (
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ ml: 'auto', fontWeight: 400 }}
          >
            max 10 — JPEG, PNG, WebP
          </Typography>
        )}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
        {imagePreviewUrls.map((url, i) => (
          <Box
            key={i}
            onClick={() => onOpenLightbox(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox(i)}
            sx={{
              position: 'relative',
              width: 110,
              height: 85,
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'divider',
              transition: 'border-color 0.2s',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <img
              src={url}
              alt={`Preview ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(i);
              }}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                width: 24,
                height: 24,
                '&:hover': { bgcolor: 'error.main' },
              }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {visibleExisting?.map((img, idx) => (
          <Box
            key={`existing-${img.id}`}
            onClick={() => onOpenLightbox(imagePreviewUrls.length + idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && onOpenLightbox(imagePreviewUrls.length + idx)
            }
            sx={{
              position: 'relative',
              width: 110,
              height: 85,
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'primary.light',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <img
              src={img.thumb || img.url}
              alt={adTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteExistingImage(img.id);
              }}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                width: 24,
                height: 24,
                '&:hover': { bgcolor: 'error.main' },
              }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {totalCount < 10 && (
          <Button
            variant="outlined"
            component="label"
            disabled={isCompressing}
            sx={{
              width: 110,
              height: 85,
              borderRadius: 2,
              borderStyle: 'dashed',
              borderWidth: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              {isCompressing ? '⌛' : '+ Photo'}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={isCompressing}
              onChange={onImageChange}
            />
          </Button>
        )}
      </Box>
      {totalCount < 10 && (
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mt: 1.5,
            p: 3,
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: isDragOver ? 'primary.50' : 'transparent',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.light',
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 32,
              color: isDragOver ? 'primary.main' : 'text.disabled',
              mb: 0.5,
            }}
          />
          <Typography
            variant="body2"
            color={isDragOver ? 'primary.main' : 'text.secondary'}
          >
            Glissez-déposez vos photos ici
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ou cliquez pour parcourir
          </Typography>
        </Box>
      )}
      {errors.images && (
        <Typography variant="caption" color="error">
          {errors.images}
        </Typography>
      )}
    </Paper>
  );
}
