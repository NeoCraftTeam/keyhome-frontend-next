'use client';

import {
  AccountBalanceWallet,
  Bathtub,
  Bed,
  CalendarMonth,
  CameraAlt,
  ElectricBolt,
  LocationOn,
  LocalParking,
  SquareFoot,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

import { formatPrice } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import type { AdImage, AdType, City, Quarter } from '@/types';
import { UserRole } from '@/types';
import type { AdFormValues, AttributeOption } from './ad-form/types';

interface AdFormLivePreviewProps {
  values: AdFormValues;
  imagePreviewUrls: string[];
  existingImages: AdImage[];
  imagesToDelete: number[];
  selectedQuarter: Quarter | null;
  selectedCity: City | null;
  adType: AdType | null;
  attributeOptions: AttributeOption[];
}

function AdFormLivePreview({
  values,
  imagePreviewUrls,
  existingImages,
  imagesToDelete,
  selectedQuarter,
  selectedCity,
  adType,
  attributeOptions,
}: AdFormLivePreviewProps) {
  const { user } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);

  // Combine existing (non-deleted) images + new blob previews as unified list
  const allImages = useMemo<AdImage[]>(() => {
    const kept = existingImages.filter(
      (img) => !imagesToDelete.includes(img.id)
    );
    const previews: AdImage[] = imagePreviewUrls.map((url, i) => ({
      id: -(i + 1),
      url,
      placeholder: null,
      thumb: url,
      large: url,
      mime_type: 'image/jpeg',
      is_primary: i === 0,
    }));
    return [...kept, ...previews];
  }, [existingImages, imagesToDelete, imagePreviewUrls]);

  // Keep activeIdx in bounds when images change
  const safeIdx =
    allImages.length > 0 ? Math.min(activeIdx, allImages.length - 1) : 0;

  const price = values.price ? parseFloat(values.price) : null;
  const isForSale = values.transaction_type === 'vente';

  const featureChips = useMemo(() => {
    const chips: { label: string; icon: React.ReactNode }[] = [];
    if (values.bedrooms && values.bedrooms !== '0') {
      chips.push({
        label: `${values.bedrooms} ch.`,
        icon: <Bed sx={{ fontSize: 14 }} />,
      });
    }
    if (values.bathrooms && values.bathrooms !== '0') {
      chips.push({
        label: `${values.bathrooms} sdb.`,
        icon: <Bathtub sx={{ fontSize: 14 }} />,
      });
    }
    if (values.surface_area) {
      chips.push({
        label: `${values.surface_area} m²`,
        icon: <SquareFoot sx={{ fontSize: 14 }} />,
      });
    }
    if (values.has_parking) {
      chips.push({
        label: 'Parking',
        icon: <LocalParking sx={{ fontSize: 14 }} />,
      });
    }
    return chips;
  }, [
    values.bedrooms,
    values.bathrooms,
    values.surface_area,
    values.has_parking,
  ]);

  const resolvedAttributes = useMemo(
    () =>
      values.attributes.map(
        (v) => attributeOptions.find((o) => o.value === v)?.label ?? v
      ),
    [values.attributes, attributeOptions]
  );

  const showAboutSection =
    !!values.deposit_amount ||
    !!values.minimum_lease_duration ||
    values.charges_forfaitaires;

  const avatarInitials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase()
    : '?';

  const ownerLabel =
    user?.role === UserRole.AGENT ? 'Agent immobilier' : 'Propriétaire';

  const hasAnyContent =
    allImages.length > 0 ||
    !!values.title ||
    !!price ||
    featureChips.length > 0 ||
    !!values.description;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
          Aperçu
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.35 },
              },
              animation: 'pulse 1.8s ease-in-out infinite',
            }}
          />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            En direct
          </Typography>
        </Box>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {!hasAnyContent ? (
          /* Empty state */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              py: 8,
              px: 3,
              color: 'text.disabled',
            }}
          >
            <CameraAlt sx={{ fontSize: 48, opacity: 0.35 }} />
            <Typography
              variant="body2"
              textAlign="center"
              color="text.disabled"
            >
              Commencez à remplir le formulaire pour voir l&apos;aperçu de votre
              annonce ici.
            </Typography>
          </Box>
        ) : (
          <>
            {/* ── Image gallery — CSS Grid matching AdDetailClient ── */}
            <Box
              sx={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns:
                  allImages.length >= 5
                    ? '2fr 1fr 1fr'
                    : allImages.length >= 3
                      ? '2fr 1fr'
                      : allImages.length === 2
                        ? '1fr 1fr'
                        : '1fr',
                gridTemplateRows:
                  allImages.length <= 1 ? '280px' : '140px 140px',
                gap: '3px',
                bgcolor: 'grey.100',
                overflow: 'hidden',
              }}
            >
              {allImages.length > 0 ? (
                <>
                  {/* Hero image with crossfade */}
                  <Box
                    onClick={() => setActiveIdx(0)}
                    sx={{
                      gridRow: allImages.length >= 2 ? '1 / 3' : 'auto',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <AnimatePresence mode="sync">
                      <Box
                        component={motion.div}
                        key={allImages[safeIdx]?.id ?? safeIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                        sx={{ position: 'absolute', inset: 0 }}
                      >
                        <Box
                          component="img"
                          src={allImages[safeIdx]?.url}
                          alt="preview"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </Box>
                    </AnimatePresence>
                  </Box>

                  {/* Secondary images */}
                  {allImages.slice(1, 5).map((img, idx) => (
                    <Box
                      key={img.id}
                      onClick={() => setActiveIdx(idx + 1)}
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        outline: safeIdx === idx + 1 ? '2px solid' : 'none',
                        outlineColor: 'primary.main',
                        outlineOffset: -2,
                        '&:hover img': { transform: 'scale(1.05)' },
                      }}
                    >
                      <Box
                        component="img"
                        src={img.thumb || img.url}
                        alt={`photo-${idx + 2}`}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </Box>
                  ))}

                  {/* Photo count badge */}
                  {allImages.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        pointerEvents: 'none',
                      }}
                    >
                      {allImages.length} photos
                    </Box>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    color: 'text.disabled',
                    gridColumn: '1 / -1',
                  }}
                >
                  <CameraAlt sx={{ fontSize: 40, opacity: 0.4 }} />
                  <Typography variant="caption" color="text.disabled">
                    Vos photos apparaîtront ici
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ── Main content ── */}
            <Box sx={{ px: 2, pt: 1.75, pb: 1 }}>
              {/* Price + transaction badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  mb: 0.5,
                }}
              >
                {price !== null ? (
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    color="primary"
                    lineHeight={1}
                  >
                    {formatPrice(price)}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 26,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                    }}
                  />
                )}
                <Chip
                  label={isForSale ? 'Vente' : 'Location'}
                  size="small"
                  color={isForSale ? 'primary' : 'default'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
                {adType && (
                  <Chip
                    label={adType.name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              {/* Title */}
              {values.title ? (
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  lineHeight={1.3}
                  sx={{ mt: 0.5, mb: 0.75 }}
                >
                  {values.title}
                </Typography>
              ) : (
                <Box
                  sx={{
                    mt: 0.75,
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      height: 16,
                      bgcolor: 'grey.200',
                      borderRadius: 0.5,
                      width: '90%',
                    }}
                  />
                  <Box
                    sx={{
                      height: 16,
                      bgcolor: 'grey.200',
                      borderRadius: 0.5,
                      width: '60%',
                    }}
                  />
                </Box>
              )}

              {/* Location */}
              {(selectedQuarter || selectedCity) && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <LocationOn
                    sx={{
                      fontSize: 14,
                      color: 'text.secondary',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[selectedQuarter?.name, selectedCity?.name]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Box>
              )}

              {/* Feature chips */}
              {featureChips.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    mb: 1,
                  }}
                >
                  {featureChips.map((chip) => (
                    <Chip
                      key={chip.label}
                      icon={chip.icon as React.ReactElement}
                      label={chip.label}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.72rem' }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* ── Description ── */}
            {values.description && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
                    Description
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                    }}
                  >
                    {values.description}
                  </Typography>
                  {values.description.length > 280 && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ mt: 0.25, display: 'block', cursor: 'default' }}
                    >
                      Voir plus
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* ── About / Informations supplémentaires ── */}
            {showAboutSection && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Informations supplémentaires
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
                  >
                    {values.deposit_amount && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccountBalanceWallet
                          sx={{
                            fontSize: 16,
                            color: 'text.secondary',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Caution :{' '}
                          <Box
                            component="span"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {formatPrice(parseFloat(values.deposit_amount))}
                          </Box>
                        </Typography>
                      </Box>
                    )}
                    {values.minimum_lease_duration && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <CalendarMonth
                          sx={{
                            fontSize: 16,
                            color: 'text.secondary',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Durée min :{' '}
                          <Box
                            component="span"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {values.minimum_lease_duration} mois
                          </Box>
                        </Typography>
                      </Box>
                    )}
                    {values.charges_forfaitaires && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <ElectricBolt
                          sx={{
                            fontSize: 16,
                            color: 'text.secondary',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Charges comprises
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* ── Equipment & attributes ── */}
            {resolvedAttributes.length > 0 && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Équipements &amp; Services
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {resolvedAttributes.slice(0, 8).map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    ))}
                    {resolvedAttributes.length > 8 && (
                      <Chip
                        label={`+${resolvedAttributes.length - 8} autres`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* ── Owner card ── */}
            <Divider sx={{ mx: 2, my: 0 }} />
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  mb: 1.25,
                }}
              >
                <Avatar
                  src={user?.avatar ?? undefined}
                  alt={user?.display_name ?? 'Annonceur'}
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: '0.85rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {avatarInitials}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {user?.display_name ?? user?.firstname ?? 'Annonceur'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ownerLabel}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                disabled
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Contacter
              </Button>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ mt: 0.75, display: 'block', textAlign: 'center' }}
              >
                Vous êtes l&apos;annonceur
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* ── Footer watermark ── */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          pb: 1.5,
          pt: 1,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="caption" color="text.disabled">
          Aperçu · Non publié
        </Typography>
      </Box>
    </Paper>
  );
}

export default memo(AdFormLivePreview);
