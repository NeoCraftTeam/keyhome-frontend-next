import { Delete as DeleteIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import type { AdImage } from '@/types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormPhotosProps {
  imagePreviewUrls: string[];
  existingImages?: AdImage[];
  imagesToDelete: number[];
  imageCount: number;
  adTitle?: string;
  errors: Record<string, string>;
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
  onImageChange,
  onRemoveImage,
  onDeleteExistingImage,
  onOpenLightbox,
}: AdFormPhotosProps) {
  const visibleExisting = existingImages?.filter((img) => !imagesToDelete.includes(img.id));
  const totalCount = imageCount + (visibleExisting?.length ?? 0);

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PhotoCameraIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Photos du bien
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 'auto', fontWeight: 400 }}>
          max 10 — JPEG, PNG, WebP
        </Typography>
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
              onClick={(e) => { e.stopPropagation(); onRemoveImage(i); }}
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
            onKeyDown={(e) => e.key === 'Enter' && onOpenLightbox(imagePreviewUrls.length + idx)}
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
              onClick={(e) => { e.stopPropagation(); onDeleteExistingImage(img.id); }}
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
            <Typography variant="caption" fontWeight={600}>+ Photo</Typography>
            <input
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
            />
          </Button>
        )}
      </Box>
      {errors.images && (
        <Typography variant="caption" color="error">{errors.images}</Typography>
      )}
    </Paper>
  );
}
