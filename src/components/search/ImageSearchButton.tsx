'use client';

import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import api from '@/lib/api';

export interface ParsedSearchParams {
  q?: string | null;
  city_name?: string | null;
  city_id?: string | null;
  type_id?: string | null;
  type_name?: string | null;
  quarter_name?: string | null;
  transaction_type?: string | null;
  bedrooms?: number | null;
  price_max?: number | null;
  price_min?: number | null;
  surface_min?: number | null;
  has_parking?: boolean | null;
  furnished?: boolean | null;
}

interface Props {
  onResult: (parsed: ParsedSearchParams) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  /** Size of the icon button — defaults to 32 */
  size?: number;
}

export default function ImageSearchButton({
  onResult,
  onError,
  disabled,
  size = 32,
}: Props) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<ParsedSearchParams>(
        '/ads/search/image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        }
      );
      onResult(res.data);
    } catch {
      onError?.("Impossible d'analyser l'image. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Tooltip title="Recherche par photo">
        <Box
          role="button"
          tabIndex={disabled || loading ? -1 : 0}
          aria-label="Lancer une recherche par image"
          onClick={() => !disabled && !loading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && !loading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled || loading ? 'default' : 'pointer',
            color: 'text.secondary',
            transition: 'color 0.2s',
            '&:hover': disabled || loading ? {} : { color: 'primary.main' },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={size * 0.55}
              sx={{ color: 'primary.main' }}
            />
          ) : (
            <CameraAltIcon sx={{ fontSize: size * 0.6 }} />
          )}
        </Box>
      </Tooltip>
    </>
  );
}
