'use client';

import { neutral, shadow } from '@/theme/tokens';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import GavelIcon from '@mui/icons-material/Gavel';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty';
import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';

import {
  AdTypeCategory,
  TRANSACTION_TYPES,
  getCategoryById,
} from './ad-type-categories';
import type { AdFormValues } from './types';
import { isAdFormTextEmpty, sectionSx, sectionTitleSx } from './types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AdFormStepReviewProps {
  values: AdFormValues;
  imageCount: number;
  existingImageCount: number;
  imagesToDeleteCount: number;
  tourScenesCount: number;
  hasPdf: boolean;
  selectedCategory: AdTypeCategory | null;
  adTypes: Array<{ id: string; name: string; desc: string }>;
  onGoToStep: (step: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatPrice = (raw: string): string => {
  const num = Number(raw);
  if (!raw || isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
};

const empty = (v: string | undefined | null): boolean => isAdFormTextEmpty(v);

const ValueChip = ({ label }: { label: string }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      bgcolor: 'grey.100',
      color: 'text.primary',
      fontWeight: 600,
      fontSize: '0.8rem',
      px: 0.5,
    }}
  />
);

const Placeholder = () => (
  <Typography
    variant="body2"
    sx={{ color: 'text.disabled', fontStyle: 'italic' }}
  >
    Non renseigné
  </Typography>
);

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  step: number;
  onGoToStep: (step: number) => void;
  children: React.ReactNode;
}

function Section({ icon, title, step, onGoToStep, children }: SectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...sectionSx,
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ ...sectionTitleSx, mb: 0 }}>
          {icon}
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onGoToStep(step)}
          aria-label={`Modifier ${title}`}
          sx={{
            color: 'primary.main',
            '&:hover': { bgcolor: 'primary.light', color: neutral.white },
            '&:focus-visible': { boxShadow: shadow.agentFocusRing },
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Paper>
  );
}

/* ------------------------------------------------------------------ */
/*  Key-value grid                                                     */
/* ------------------------------------------------------------------ */

function KVGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

function KVItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{children}</Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AdFormStepReview({
  values,
  imageCount,
  existingImageCount,
  imagesToDeleteCount,
  tourScenesCount,
  hasPdf,
  selectedCategory,
  adTypes,
  onGoToStep,
}: AdFormStepReviewProps) {
  const categoryConfig = selectedCategory
    ? getCategoryById(selectedCategory)
    : null;
  const hiddenFields = new Set(categoryConfig?.hiddenFields ?? []);

  const isTerrain = selectedCategory === AdTypeCategory.TERRAIN;

  const adTypeName = adTypes.find((t) => t.id === values.type_id)?.name ?? '—';

  const transactionLabel =
    TRANSACTION_TYPES.find((t) => t.value === values.transaction_type)?.label ??
    '—';

  const totalPhotos = imageCount + existingImageCount - imagesToDeleteCount;

  const truncatedDescription =
    values.description.length > 150
      ? values.description.slice(0, 150) + '…'
      : values.description || '—';

  const hasCoordinates =
    values.latitude !== 0 &&
    values.longitude !== 0 &&
    !(values.latitude === 4.0511 && values.longitude === 9.7679);

  const showEquipmentSection =
    !hiddenFields.has('deposit_amount') || !hiddenFields.has('attributes');

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Récapitulatif de l&apos;annonce
        </Typography>
      </Box>

      {/* ─── 1. Type & Transaction ─── */}
      <Section
        icon={<CategoryIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
        title="Type & Transaction"
        step={0}
        onGoToStep={onGoToStep}
      >
        <KVGrid>
          <KVItem label="Catégorie">
            {categoryConfig ? (
              <ValueChip label={categoryConfig.label} />
            ) : (
              <Placeholder />
            )}
          </KVItem>
          <KVItem label="Type de bien">
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {adTypeName}
            </Typography>
          </KVItem>
          <KVItem label="Transaction">
            <ValueChip label={transactionLabel} />
          </KVItem>
        </KVGrid>
      </Section>

      {/* ─── 2. Informations de base ─── */}
      <Section
        icon={<InfoIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
        title="Informations de base"
        step={1}
        onGoToStep={onGoToStep}
      >
        <KVGrid>
          <KVItem label="Titre">
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {empty(values.title) ? '—' : values.title}
            </Typography>
          </KVItem>
          <KVItem label="Description">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {truncatedDescription}
            </Typography>
          </KVItem>
        </KVGrid>
      </Section>

      {/* ─── 3. Photos ─── */}
      <Section
        icon={<PhotoCameraIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
        title="Photos"
        step={1}
        onGoToStep={onGoToStep}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="body2">
            {totalPhotos > 0
              ? `${totalPhotos} photo${totalPhotos > 1 ? 's' : ''}`
              : 'Aucune photo ajoutée'}
          </Typography>
          {hasPdf && (
            <Chip
              icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
              label="État des lieux PDF"
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Box>
      </Section>

      {/* ─── 4. Détails ─── */}
      <Section
        icon={<LocationOnIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
        title="Détails"
        step={2}
        onGoToStep={onGoToStep}
      >
        <KVGrid>
          <KVItem label="Adresse">
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {empty(values.adresse) ? '—' : values.adresse}
            </Typography>
          </KVItem>
          <KVItem label="Prix">
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              {formatPrice(values.price)}
              {values.transaction_type === 'location' && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  /{values.price_period === 'jour' ? 'jour' : 'mois'}
                </Typography>
              )}
            </Typography>
          </KVItem>
          <KVItem label="Surface">
            {empty(values.surface_area) ? (
              <Placeholder />
            ) : (
              <ValueChip label={`📐 ${values.surface_area} m²`} />
            )}
          </KVItem>

          {!isTerrain && !hiddenFields.has('bedrooms') && (
            <KVItem label="Chambres / SDB / Parking">
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <ValueChip
                  label={`🛏 ${values.bedrooms || '0'} chambre${Number(values.bedrooms) !== 1 ? 's' : ''}`}
                />
                <ValueChip label={`🚿 ${values.bathrooms || '0'} SDB`} />
                {values.has_parking && <ValueChip label="🅿️ Parking" />}
              </Box>
            </KVItem>
          )}
        </KVGrid>
      </Section>

      {/* ─── 5. Équipements & Conditions ─── */}
      {showEquipmentSection && (
        <Section
          icon={<GavelIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
          title="Équipements & Conditions"
          step={3}
          onGoToStep={onGoToStep}
        >
          <KVGrid>
            {!hiddenFields.has('attributes') && (
              <KVItem label="Équipements">
                <Typography variant="body2">
                  {values.attributes.length > 0
                    ? `${values.attributes.length} équipement${values.attributes.length > 1 ? 's' : ''} sélectionné${values.attributes.length > 1 ? 's' : ''}`
                    : '—'}
                </Typography>
              </KVItem>
            )}
            {!hiddenFields.has('deposit_amount') && (
              <KVItem label="Caution">
                <Typography variant="body2">
                  {empty(values.deposit_amount)
                    ? '—'
                    : formatPrice(values.deposit_amount)}
                </Typography>
              </KVItem>
            )}
            {!hiddenFields.has('minimum_lease_duration') && (
              <KVItem label="Durée min. du bail">
                <Typography variant="body2">
                  {empty(values.minimum_lease_duration)
                    ? '—'
                    : `${values.minimum_lease_duration} mois`}
                </Typography>
              </KVItem>
            )}
          </KVGrid>
        </Section>
      )}

      {/* ─── 6. Médias & Localisation ─── */}
      <Section
        icon={<MapIcon sx={{ color: 'primary.main', fontSize: 22 }} />}
        title="Médias & Localisation"
        step={4}
        onGoToStep={onGoToStep}
      >
        <KVGrid>
          <KVItem label="Visite virtuelle 360°">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ThreeSixtyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                {tourScenesCount > 0
                  ? `${tourScenesCount} scène${tourScenesCount > 1 ? 's' : ''}`
                  : 'Aucune scène'}
              </Typography>
            </Box>
          </KVItem>
          <KVItem label="Coordonnées GPS">
            {hasCoordinates ? (
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              >
                {values.latitude.toFixed(5)}, {values.longitude.toFixed(5)}
              </Typography>
            ) : (
              <Placeholder />
            )}
          </KVItem>
          <KVItem label="Boost">
            {values.is_boost_requested ? (
              <Chip
                icon={<RocketLaunchIcon sx={{ fontSize: 16 }} />}
                label="Boost activé"
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Non
              </Typography>
            )}
          </KVItem>
        </KVGrid>
      </Section>
    </Stack>
  );
}
