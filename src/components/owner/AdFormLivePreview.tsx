'use client';

import {
  AccountBalanceWallet,
  Bathtub,
  Bed,
  CalendarMonth,
  CameraAlt,
  DirectionsBus,
  ElectricBolt,
  LocalHospital,
  LocationOn,
  LocalParking,
  NearMe,
  Panorama,
  School,
  SquareFoot,
  Storefront,
  TrendingUp,
  WaterDrop,
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
import dynamic from 'next/dynamic';
import { memo, useEffect, useMemo, useState } from 'react';

import { formatPrice } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import type { AdImage, AdType, City, Quarter } from '@/types';
import { UserRole } from '@/types';
import {
  AD_FORM_MAP_DEFAULT_LAT,
  AD_FORM_MAP_DEFAULT_LNG,
} from './ad-form/types';
import type { AdFormValues, AttributeOption } from './ad-form/types';

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

const AdLocationMap = dynamic(() => import('@/components/ads/AdLocationMap'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 200,
        bgcolor: 'action.hover',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Chargement de la carte…
      </Typography>
    </Box>
  ),
});

function formatOptionalCfaAmount(raw: string): string | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const n = parseFloat(t.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) {
    return t;
  }
  return formatPrice(Math.round(n));
}

function leaseDurationLabel(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return '';
  }
  if (/^\d+$/.test(t)) {
    const m = parseInt(t, 10);
    return `${m} mois`;
  }
  return t;
}

interface AdFormLivePreviewProps {
  values: AdFormValues;
  imagePreviewUrls: string[];
  existingImages: AdImage[];
  imagesToDelete: number[];
  selectedQuarter: Quarter | null;
  selectedCity: City | null;
  adType: AdType | null;
  attributeOptions: AttributeOption[];
  /** Panoramas with fichier ou image déjà chargée */
  tourSceneCount: number;
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
  tourSceneCount,
}: AdFormLivePreviewProps) {
  const { user } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);

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

  useEffect(() => {
    setActiveIdx((i) => {
      if (allImages.length === 0) {
        return 0;
      }
      return Math.min(i, allImages.length - 1);
    });
  }, [allImages.length]);

  const safeIdx =
    allImages.length > 0 ? Math.min(activeIdx, allImages.length - 1) : 0;
  const activeImage = allImages[safeIdx];

  const price = values.price ? parseFloat(values.price) : null;
  const priceValid = price !== null && Number.isFinite(price);
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

  const furnishedHint = useMemo(() => {
    const hit = resolvedAttributes.find((l) => /meubl/i.test(l));
    return hit ?? null;
  }, [resolvedAttributes]);

  const depositDisplay = useMemo(
    () => formatOptionalCfaAmount(values.deposit_amount),
    [values.deposit_amount]
  );

  const chargesForfaitAmount = useMemo(
    () => formatOptionalCfaAmount(values.charges_montant_forfait),
    [values.charges_montant_forfait]
  );

  const chargesEau = useMemo(
    () => formatOptionalCfaAmount(values.charges_eau),
    [values.charges_eau]
  );

  const chargesElec = useMemo(
    () => formatOptionalCfaAmount(values.charges_electricite),
    [values.charges_electricite]
  );

  const hasChargesSection =
    values.charges_forfaitaires ||
    !!chargesForfaitAmount ||
    !!chargesEau ||
    !!chargesElec ||
    !!(values.charges_autres && values.charges_autres.trim());

  const showAboutSection =
    !!depositDisplay ||
    !!values.minimum_lease_duration.trim() ||
    hasChargesSection;

  const avatarInitials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase()
    : '?';

  const ownerLabel =
    user?.role === UserRole.AGENT ? 'Agent immobilier' : 'Propriétaire';

  const hasCustomMapPin =
    values.latitude !== AD_FORM_MAP_DEFAULT_LAT ||
    values.longitude !== AD_FORM_MAP_DEFAULT_LNG;

  const proximityItems = [
    {
      key: 'main_road',
      icon: <NearMe sx={{ fontSize: 17, color: '#64748B' }} />,
      iconBg: 'rgba(100,116,139,0.10)',
      label: 'Route principale',
      raw: values.distance_main_road_m,
    },
    {
      key: 'shops',
      icon: <Storefront sx={{ fontSize: 17, color: '#059669' }} />,
      iconBg: 'rgba(5,150,105,0.10)',
      label: 'Commerces',
      raw: values.distance_shops_m,
    },
    {
      key: 'transport',
      icon: <DirectionsBus sx={{ fontSize: 17, color: '#3B82F6' }} />,
      iconBg: 'rgba(59,130,246,0.10)',
      label: 'Transport',
      raw: values.distance_transport_m,
    },
    {
      key: 'school',
      icon: <School sx={{ fontSize: 17, color: '#8B5CF6' }} />,
      iconBg: 'rgba(139,92,246,0.10)',
      label: 'École / Université',
      raw: values.distance_school_m,
    },
    {
      key: 'hospital',
      icon: <LocalHospital sx={{ fontSize: 17, color: '#EF4444' }} />,
      iconBg: 'rgba(239,68,68,0.10)',
      label: 'Hôpital / Clinique',
      raw: values.distance_hospital_m,
    },
  ]
    .map((item) => {
      const m = parseFloat(item.raw);
      if (!item.raw || Number.isNaN(m) || m <= 0) {
        return null;
      }
      const distance =
        m >= 1000
          ? `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
          : `${m} m`;
      return { ...item, distance };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const hasProximityData = proximityItems.length > 0;
  const mapLat =
    values.latitude && !Number.isNaN(values.latitude) ? values.latitude : null;
  const mapLng =
    values.longitude && !Number.isNaN(values.longitude)
      ? values.longitude
      : null;
  const hasMap = hasCustomMapPin && mapLat !== null && mapLng !== null;

  const hasStarted =
    !!values.type_id ||
    !!values.title.trim() ||
    allImages.length > 0 ||
    !!values.quarter_id ||
    !!values.description.trim() ||
    !!values.price.trim() ||
    !!values.adresse.trim() ||
    (values.attributes?.length ?? 0) > 0 ||
    tourSceneCount > 0 ||
    !!values.is_boost_requested ||
    hasProximityData ||
    hasMap;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            fontWeight={700}
            letterSpacing={1.5}
            color="text.secondary"
            sx={{ display: 'block', lineHeight: 1.2 }}
          >
            Aperçu public
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Mise à jour instantanée
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'success.main',
              '@keyframes pulse-dot': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(1.4)' },
              },
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }}
          />
          <Typography variant="caption" fontWeight={600} color="success.main">
            En direct
          </Typography>
        </Box>
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {!hasStarted ? (
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
              sx={{ maxWidth: 280 }}
            >
              Choisissez un type de bien pour voir ici le rendu de votre
              annonce, puis complétez les étapes — tout se met à jour en temps
              réel.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                position: 'relative',
                bgcolor: 'grey.100',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '3/2',
                  width: '100%',
                  maxHeight: { md: 340, lg: 400, xl: 460 },
                  minHeight: { md: 200, lg: 240 },
                  overflow: 'hidden',
                  bgcolor: 'grey.200',
                }}
              >
                {activeImage ? (
                  <AnimatePresence mode="sync">
                    <Box
                      component={motion.div}
                      key={`${activeImage.id}-${activeImage.url}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                      }}
                    >
                      <Box
                        component="img"
                        src={activeImage.url}
                        alt=""
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </Box>
                  </AnimatePresence>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      minHeight: 160,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: 'text.disabled',
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 40, opacity: 0.4 }} />
                    <Typography variant="caption" color="text.disabled">
                      Ajoutez des photos à l&apos;étape « Infos »
                    </Typography>
                  </Box>
                )}

                {allImages.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      bgcolor: 'rgba(0,0,0,0.62)',
                      color: '#fff',
                      px: 1,
                      py: 0.35,
                      borderRadius: 1,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      pointerEvents: 'none',
                    }}
                  >
                    {safeIdx + 1} / {allImages.length}
                  </Box>
                )}
              </Box>

              {allImages.length > 1 && (
                <Box
                  role="tablist"
                  aria-label="Photos de l'annonce"
                  sx={{
                    display: 'flex',
                    gap: 0.75,
                    p: 1,
                    overflowX: 'auto',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'grey.400',
                      borderRadius: 2,
                    },
                  }}
                >
                  {allImages.map((img, idx) => (
                    <Box
                      key={img.id}
                      component="button"
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      aria-label={`Photo ${idx + 1}`}
                      aria-current={idx === safeIdx ? 'true' : undefined}
                      sx={{
                        flex: '0 0 auto',
                        width: 56,
                        height: 56,
                        p: 0,
                        border: '2px solid',
                        borderColor:
                          idx === safeIdx ? 'primary.main' : 'transparent',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        bgcolor: 'grey.100',
                        opacity: idx === safeIdx ? 1 : 0.72,
                        transition:
                          'border-color 160ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms',
                      }}
                    >
                      <Box
                        component="img"
                        src={img.thumb || img.url}
                        alt=""
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ px: { md: 2.25, lg: 3 }, pt: 2, pb: 1.25 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  flexWrap: 'wrap',
                  mb: 0.75,
                }}
              >
                {priceValid ? (
                  <Typography
                    variant="h5"
                    component="div"
                    fontWeight={800}
                    color="primary"
                    lineHeight={1.1}
                    sx={{ fontSize: { md: '1.35rem', lg: '1.5rem' } }}
                  >
                    {formatPrice(price)}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 26,
                      bgcolor: 'action.hover',
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
                {furnishedHint && (
                  <Chip
                    label={furnishedHint}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                {values.is_boost_requested && (
                  <Chip
                    icon={<TrendingUp sx={{ fontSize: '16px !important' }} />}
                    label="Boost souhaité"
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
                {tourSceneCount > 0 && (
                  <Chip
                    icon={<Panorama sx={{ fontSize: '16px !important' }} />}
                    label={
                      tourSceneCount === 1
                        ? 'Visite 360°'
                        : `Visite 360° · ${tourSceneCount}`
                    }
                    size="small"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>

              {values.title ? (
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight={700}
                  lineHeight={1.35}
                  sx={{
                    mb: 0.75,
                    fontSize: { md: '1.05rem', lg: '1.15rem' },
                  }}
                >
                  {values.title}
                </Typography>
              ) : (
                <Box
                  sx={{
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      height: 16,
                      bgcolor: 'action.hover',
                      borderRadius: 0.5,
                      width: '92%',
                    }}
                  />
                  <Box
                    sx={{
                      height: 16,
                      bgcolor: 'action.hover',
                      borderRadius: 0.5,
                      width: '58%',
                    }}
                  />
                </Box>
              )}

              {(values.adresse.trim() || selectedQuarter || selectedCity) && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <LocationOn
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      flexShrink: 0,
                      mt: '2px',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.45 }}
                  >
                    {values.adresse.trim() && (
                      <Box component="span" sx={{ display: 'block' }}>
                        {values.adresse.trim()}
                      </Box>
                    )}
                    {(selectedQuarter || selectedCity) && (
                      <Box component="span" sx={{ display: 'block' }}>
                        {[selectedQuarter?.name, selectedCity?.name]
                          .filter(Boolean)
                          .join(', ')}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}

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

            <Divider sx={{ mx: 2, my: 0 }} />
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
                Description
              </Typography>
              {values.description.trim() ? (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {values.description}
                  </Typography>
                  {values.description.length > 320 && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      … comme sur la fiche publique (aperçu tronqué)
                    </Typography>
                  )}
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  fontStyle="italic"
                >
                  Votre texte descriptif apparaîtra ici mot pour mot.
                </Typography>
              )}
            </Box>

            {showAboutSection && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Conditions &amp; charges
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {depositDisplay && (
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
                            {depositDisplay}
                          </Box>
                        </Typography>
                      </Box>
                    )}
                    {!!values.minimum_lease_duration.trim() && (
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
                          Durée minimale :{' '}
                          <Box
                            component="span"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {leaseDurationLabel(values.minimum_lease_duration)}
                          </Box>
                        </Typography>
                      </Box>
                    )}
                    {hasChargesSection && (
                      <Box
                        sx={{
                          pl: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                        }}
                      >
                        {values.charges_forfaitaires && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <ElectricBolt
                              sx={{
                                fontSize: 16,
                                color: 'text.secondary',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Charges forfaitaires
                              {chargesForfaitAmount && (
                                <>
                                  {' : '}
                                  <Box
                                    component="span"
                                    fontWeight={600}
                                    color="text.primary"
                                  >
                                    {chargesForfaitAmount}
                                  </Box>
                                </>
                              )}
                            </Typography>
                          </Box>
                        )}
                        {chargesEau && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <WaterDrop
                              sx={{
                                fontSize: 16,
                                color: 'text.secondary',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Eau :{' '}
                              <Box
                                component="span"
                                fontWeight={600}
                                color="text.primary"
                              >
                                {chargesEau}
                              </Box>
                            </Typography>
                          </Box>
                        )}
                        {chargesElec && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <ElectricBolt
                              sx={{
                                fontSize: 16,
                                color: 'text.secondary',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Électricité :{' '}
                              <Box
                                component="span"
                                fontWeight={600}
                                color="text.primary"
                              >
                                {chargesElec}
                              </Box>
                            </Typography>
                          </Box>
                        )}
                        {values.charges_autres.trim() && (
                          <Typography variant="body2" color="text.secondary">
                            Autres charges :{' '}
                            <Box
                              component="span"
                              fontWeight={600}
                              color="text.primary"
                            >
                              {values.charges_autres.trim()}
                            </Box>
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {resolvedAttributes.length > 0 && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Équipements &amp; services
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {resolvedAttributes.slice(0, 12).map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    ))}
                    {resolvedAttributes.length > 12 && (
                      <Chip
                        label={`+${resolvedAttributes.length - 12}`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}

            {hasMap && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                    Localisation
                  </Typography>
                  <AdLocationMap
                    latitude={mapLat!}
                    longitude={mapLng!}
                    quartierName={selectedQuarter?.name}
                    cityName={selectedCity?.name}
                    isLocked={false}
                  />
                </Box>
              </>
            )}

            {hasProximityData && (
              <>
                <Divider sx={{ mx: 2, my: 0 }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <NearMe sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Proximité &amp; accessibilité
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 1,
                    }}
                  >
                    {proximityItems.map((item) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.25,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            bgcolor: item.iconBg,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontWeight: 500,
                              display: 'block',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="text.primary"
                            sx={{ lineHeight: 1.2, fontSize: '0.78rem' }}
                          >
                            {item.distance}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}

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
                Vous êtes l&apos;annonceur — bouton inactif en aperçu
              </Typography>
            </Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'warning.50',
          borderTop: '1px solid',
          borderColor: 'warning.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'warning.500',
          }}
        />
        <Typography variant="caption" fontWeight={600} color="warning.700">
          Brouillon · non publié
        </Typography>
      </Box>
    </Paper>
  );
}

export default memo(AdFormLivePreview);
