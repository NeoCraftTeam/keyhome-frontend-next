'use client';

import { Price } from '@/components/ui/typography/Price';
import { getAttributeLabel } from '@/lib/attribute-labels';
import { getComparatorAttributeSlugsForAds } from '@/lib/comparator-attributes';
import { Ad } from '@/types';
import Bathtub from '@mui/icons-material/Bathtub';
import Bed from '@mui/icons-material/Bed';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import OpenInNew from '@mui/icons-material/OpenInNew';
import SquareFoot from '@mui/icons-material/SquareFoot';
import StarRounded from '@mui/icons-material/StarRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';

type Better = 'higher' | 'lower';

interface CellContext {
  isBest: boolean;
}

interface Criterion {
  key: string;
  label: string | ((ads: Ad[]) => string);
  icon?: ReactNode;
  /** Numeric value used to pick the "best" cell; null = not comparable for this ad. */
  rawValue?: (ad: Ad) => number | null;
  better?: Better;
  render: (ad: Ad, ctx: CellContext) => ReactNode;
  /** Hide the whole row unless at least one ad carries meaningful data. */
  isRelevant?: (ads: Ad[]) => boolean;
}

interface CriterionGroup {
  title: string;
  criteria: Criterion[];
}

interface ComparisonTableProps {
  items: Ad[];
  onRemove?: (id: string) => void;
  showActions?: boolean;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/[^\d.,-]/g, '')
            .replace(',', '.')
        );
  return Number.isFinite(n) ? n : null;
}

function formatDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'd MMM yyyy', { locale: fr }) : null;
}

function renderMuted(text = '—'): ReactNode {
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ color: 'text.disabled' }}
    >
      {text}
    </Typography>
  );
}

function renderBool(value: boolean): ReactNode {
  return value ? (
    <Chip
      size="small"
      icon={<Check sx={{ fontSize: 15 }} />}
      label="Oui"
      color="success"
      variant="outlined"
      sx={{ fontWeight: 600, '& .MuiChip-icon': { ml: 0.5 } }}
    />
  ) : (
    renderMuted('Non')
  );
}

function keyScoreTone(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) {
    return 'success';
  }
  if (score >= 45) {
    return 'warning';
  }
  return 'error';
}

/** Transaction-aware header label: sale vs rent (per-night vs per-month). */
function priceLabel(ads: Ad[]): string {
  const hasSale = ads.some((a) => a.transaction_type === 'vente');
  const hasRent = ads.some((a) => a.transaction_type === 'location');
  if (hasSale && !hasRent) {
    return 'Prix de vente';
  }
  if (hasRent && !hasSale) {
    return ads.some((a) => a.price_period === 'jour')
      ? 'Loyer / nuit'
      : 'Loyer / mois';
  }
  return 'Prix';
}

const priceCriterion: Criterion = {
  key: 'price',
  label: priceLabel,
  rawValue: (ad) => ad.price,
  better: 'lower',
  render: (ad) => {
    if (ad.price == null) {
      return renderMuted('Prix non défini');
    }
    const suffix =
      ad.transaction_type === 'location'
        ? ad.price_period === 'jour'
          ? ' / nuit'
          : ' / mois'
        : '';
    return (
      <Box component="span" sx={{ fontWeight: 700 }}>
        <Price amountXAF={ad.price} />
        {suffix ? (
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            {suffix}
          </Typography>
        ) : null}
      </Box>
    );
  },
};

const pricePerSqmCriterion: Criterion = {
  key: 'price_per_sqm',
  label: 'Prix / m²',
  isRelevant: (ads) => ads.some((a) => a.price != null && a.surface_area > 0),
  rawValue: (ad) =>
    ad.price != null && ad.surface_area > 0 ? ad.price / ad.surface_area : null,
  better: 'lower',
  render: (ad) => {
    if (ad.price == null || !(ad.surface_area > 0)) {
      return renderMuted();
    }
    return (
      <Box component="span">
        <Price amountXAF={Math.round(ad.price / ad.surface_area)} />
        <Typography
          component="span"
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          {' '}
          / m²
        </Typography>
      </Box>
    );
  },
};

const surfaceCriterion: Criterion = {
  key: 'surface',
  label: 'Surface',
  icon: <SquareFoot sx={{ fontSize: 16 }} />,
  isRelevant: (ads) => ads.some((a) => a.surface_area > 0),
  rawValue: (ad) => (ad.surface_area > 0 ? ad.surface_area : null),
  better: 'higher',
  render: (ad) =>
    ad.surface_area > 0 ? `${ad.surface_area} m²` : renderMuted(),
};

const typeCriterion: Criterion = {
  key: 'type',
  label: 'Type de bien',
  isRelevant: (ads) => ads.some((a) => Boolean(a.type?.name)),
  render: (ad) =>
    ad.type?.name ? (
      <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
        {ad.type.name}
      </Typography>
    ) : (
      renderMuted()
    ),
};

const bedroomsCriterion: Criterion = {
  key: 'bedrooms',
  label: 'Chambres',
  icon: <Bed sx={{ fontSize: 16 }} />,
  rawValue: (ad) => ad.bedrooms,
  better: 'higher',
  render: (ad) => String(ad.bedrooms),
};

const bathroomsCriterion: Criterion = {
  key: 'bathrooms',
  label: 'Salles de bain',
  icon: <Bathtub sx={{ fontSize: 16 }} />,
  rawValue: (ad) => ad.bathrooms,
  better: 'higher',
  render: (ad) => String(ad.bathrooms),
};

const parkingCriterion: Criterion = {
  key: 'parking',
  label: 'Parking',
  render: (ad) => renderBool(ad.has_parking),
};

const quarterCriterion: Criterion = {
  key: 'location',
  label: 'Emplacement',
  isRelevant: (ads) =>
    ads.some((a) => Boolean(a.quarter?.name || a.quarter?.city_name)),
  render: (ad) => {
    const name = ad.quarter?.name;
    const city = ad.quarter?.city_name;
    if (!name && !city) {
      return renderMuted();
    }
    return (
      <Box component="span">
        {name ? (
          <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
        ) : null}
        {city ? (
          <Typography
            component="span"
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary' }}
          >
            {city}
          </Typography>
        ) : null}
      </Box>
    );
  },
};

const keyScoreCriterion: Criterion = {
  key: 'keyscore',
  label: 'KeyScore quartier',
  isRelevant: (ads) => ads.some((a) => a.keyscore != null),
  rawValue: (ad) => ad.keyscore ?? null,
  better: 'higher',
  render: (ad) => {
    if (ad.keyscore == null) {
      return renderMuted('Non calculé');
    }
    const tone = keyScoreTone(ad.keyscore);
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: `${tone}.main`,
          }}
        />
        <Typography
          component="span"
          sx={{ fontWeight: 700, color: `${tone}.main` }}
        >
          {Math.round(ad.keyscore)}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          / 100
        </Typography>
      </Box>
    );
  },
};

const verifiedCriterion: Criterion = {
  key: 'verified',
  label: 'Annonce vérifiée',
  render: (ad) =>
    ad.is_verified ? (
      <Chip
        size="small"
        icon={<VerifiedRounded sx={{ fontSize: 15 }} />}
        label="Vérifiée"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 600, '& .MuiChip-icon': { ml: 0.5 } }}
      />
    ) : (
      renderMuted('Non vérifiée')
    ),
};

const ratingCriterion: Criterion = {
  key: 'rating',
  label: 'Note & avis',
  isRelevant: (ads) => ads.some((a) => (a.rating ?? 0) > 0),
  rawValue: (ad) => ad.rating ?? null,
  better: 'higher',
  render: (ad) => {
    if (!ad.rating || ad.rating <= 0) {
      return renderMuted('Aucun avis');
    }
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <StarRounded sx={{ fontSize: 17, color: 'warning.main' }} />
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {ad.rating.toFixed(1)}
        </Typography>
        {ad.reviews_count ? (
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            ({ad.reviews_count})
          </Typography>
        ) : null}
      </Box>
    );
  },
};

const tourCriterion: Criterion = {
  key: 'tour_360',
  label: 'Visite 360°',
  render: (ad) => renderBool(Boolean(ad.has_3d_tour)),
};

const chargesCriterion: Criterion = {
  key: 'charges',
  label: 'Charges',
  isRelevant: (ads) =>
    ads.some(
      (a) =>
        toNumber(a.charges_montant_forfait) != null ||
        Boolean(a.detailed_charges) ||
        Boolean(a.charges_eau || a.charges_electricite || a.charges_autres)
    ),
  rawValue: (ad) => toNumber(ad.charges_montant_forfait),
  better: 'lower',
  render: (ad) => {
    const forfait = toNumber(ad.charges_montant_forfait);
    if (forfait != null) {
      return (
        <Box component="span">
          <Price amountXAF={forfait} />
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            {' '}
            / mois
          </Typography>
        </Box>
      );
    }
    if (
      ad.detailed_charges ||
      ad.charges_eau ||
      ad.charges_electricite ||
      ad.charges_autres
    ) {
      return (
        <Typography component="span" variant="body2">
          Selon consommation
        </Typography>
      );
    }
    return renderMuted();
  },
};

const depositCriterion: Criterion = {
  key: 'deposit',
  label: 'Dépôt de garantie',
  isRelevant: (ads) => ads.some((a) => toNumber(a.deposit_amount) != null),
  rawValue: (ad) => toNumber(ad.deposit_amount),
  better: 'lower',
  render: (ad) => {
    const amount = toNumber(ad.deposit_amount);
    return amount != null ? <Price amountXAF={amount} /> : renderMuted();
  },
};

const availableFromCriterion: Criterion = {
  key: 'available_from',
  label: 'Disponible à partir du',
  isRelevant: (ads) => ads.some((a) => Boolean(a.available_from)),
  render: (ad) => {
    const date = formatDateValue(ad.available_from);
    if (!date) {
      return ad.is_currently_available ? (
        <Typography
          component="span"
          variant="body2"
          sx={{ color: 'success.main', fontWeight: 600 }}
        >
          Immédiatement
        </Typography>
      ) : (
        renderMuted()
      );
    }
    return date;
  },
};

const minLeaseCriterion: Criterion = {
  key: 'min_lease',
  label: 'Durée min. du bail',
  isRelevant: (ads) => ads.some((a) => Boolean(a.minimum_lease_duration)),
  render: (ad) =>
    ad.minimum_lease_duration ? (
      <Typography component="span" variant="body2">
        {ad.minimum_lease_duration}
      </Typography>
    ) : (
      renderMuted()
    ),
};

function buildAmenityCriteria(slugs: string[]): Criterion[] {
  return slugs.map((slug) => ({
    key: `amenity_${slug}`,
    label: getAttributeLabel(slug),
    render: (ad: Ad) =>
      (ad.attributes ?? []).includes(slug) ? (
        <Check sx={{ fontSize: 18, color: 'success.main' }} />
      ) : (
        renderMuted()
      ),
  }));
}

function buildGroups(items: Ad[], amenitySlugs: string[]): CriterionGroup[] {
  const groups: CriterionGroup[] = [
    {
      title: 'Prix & surface',
      criteria: [priceCriterion, pricePerSqmCriterion, surfaceCriterion],
    },
    {
      title: 'Caractéristiques',
      criteria: [
        typeCriterion,
        bedroomsCriterion,
        bathroomsCriterion,
        parkingCriterion,
      ],
    },
    {
      title: 'Emplacement & KeyScore',
      criteria: [quarterCriterion, keyScoreCriterion],
    },
    {
      title: 'Confiance',
      criteria: [verifiedCriterion, ratingCriterion, tourCriterion],
    },
    {
      title: 'Conditions de location',
      criteria: [
        chargesCriterion,
        depositCriterion,
        availableFromCriterion,
        minLeaseCriterion,
      ],
    },
  ];

  if (amenitySlugs.length > 0) {
    groups.push({
      title: 'Équipements',
      criteria: buildAmenityCriteria(amenitySlugs),
    });
  }

  return groups
    .map((group) => ({
      ...group,
      criteria: group.criteria.filter(
        (c) => !c.isRelevant || c.isRelevant(items)
      ),
    }))
    .filter((group) => group.criteria.length > 0);
}

function bestIdsFor(items: Ad[], criterion: Criterion): Set<string> {
  if (!criterion.rawValue || !criterion.better) {
    return new Set();
  }
  const entries = items
    .map((ad) => ({ id: ad.id, value: criterion.rawValue!(ad) }))
    .filter((e): e is { id: string; value: number } => e.value != null);
  if (entries.length < 2) {
    return new Set();
  }
  const target =
    criterion.better === 'higher'
      ? Math.max(...entries.map((e) => e.value))
      : Math.min(...entries.map((e) => e.value));
  const winners = entries.filter((e) => e.value === target);
  if (winners.length === entries.length) {
    return new Set();
  }
  return new Set(winners.map((e) => e.id));
}

export default function ComparisonTable({
  items,
  onRemove,
  showActions = false,
}: ComparisonTableProps) {
  const theme = useTheme();
  const router = useRouter();

  const amenitySlugs = getComparatorAttributeSlugsForAds(items);
  const groups = buildGroups(items, amenitySlugs);
  const columnTemplate = `minmax(148px, 210px) repeat(${items.length}, minmax(172px, 1fr))`;

  return (
    <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: columnTemplate,
          minWidth: 'min-content',
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 3,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />
        {items.map((ad) => (
          <Box
            key={`head-${ad.id}`}
            sx={{
              p: 1.5,
              borderBottom: '1px solid',
              borderLeft: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              position: 'relative',
            }}
          >
            {onRemove ? (
              <IconButton
                size="small"
                aria-label={`Retirer ${ad.title} du comparateur`}
                onClick={() => onRemove(ad.id)}
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            ) : null}
            {ad.images?.[0]?.thumb ? (
              <Box
                component="img"
                src={ad.images[0].thumb}
                alt=""
                sx={{
                  width: '100%',
                  height: 92,
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 92,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 34,
              }}
            >
              {ad.title}
            </Typography>
            {showActions ? (
              <Button
                size="small"
                variant="text"
                endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                onClick={() => router.push(`/ads/${ad.slug}`)}
                sx={{
                  textTransform: 'none',
                  alignSelf: 'flex-start',
                  px: 0.5,
                  fontWeight: 600,
                }}
              >
                Voir l&apos;annonce
              </Button>
            ) : null}
          </Box>
        ))}
        {groups.map((group) => (
          <Fragment key={group.title}>
            <Box
              sx={{
                gridColumn: '1 / -1',
                bgcolor: 'action.hover',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  position: 'sticky',
                  left: 0,
                  display: 'inline-block',
                  px: 2,
                  py: 0.75,
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: 0.5,
                }}
              >
                {group.title}
              </Typography>
            </Box>
            {group.criteria.map((criterion, ci) => {
              const best = bestIdsFor(items, criterion);
              const label =
                typeof criterion.label === 'function'
                  ? criterion.label(items)
                  : criterion.label;
              const zebra = ci % 2 === 1;
              return (
                <Fragment key={criterion.key}>
                  <Box
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: 'background.paper',
                      borderBottom: '1px solid',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    {criterion.icon ? (
                      <Box
                        sx={{ color: 'text.secondary', display: 'inline-flex' }}
                      >
                        {criterion.icon}
                      </Box>
                    ) : null}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                      {label}
                    </Typography>
                  </Box>
                  {items.map((ad) => {
                    const isBest = best.has(ad.id);
                    return (
                      <Box
                        key={ad.id}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid',
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          bgcolor: isBest
                            ? alpha(theme.palette.success.main, 0.1)
                            : zebra
                              ? 'action.hover'
                              : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontWeight: isBest ? 700 : 400,
                        }}
                      >
                        {criterion.render(ad, { isBest })}
                      </Box>
                    );
                  })}
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}
