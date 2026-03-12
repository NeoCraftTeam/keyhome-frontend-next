'use client';

import { PropertyAttribute } from '@/types';
import {
  AccessibleForward,
  AcUnit,
  Balcony,
  CheckCircleOutline,
  Checkroom,
  Deck,
  Elevator,
  FitnessCenter,
  Kitchen,
  LocalFireDepartment,
  LocalLaundryService,
  Pets,
  Pool,
  Security,
  SmokeFree,
  Tv,
  Warehouse,
  Whatshot,
  Wifi,
  Yard,
} from '@mui/icons-material';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface PropertyAttributeConfig {
  label: string;
  icon: SvgIconComponent;
  color?: string;
}

const attributeConfig: Record<string, PropertyAttributeConfig> = {
  [PropertyAttribute.Wifi]: { label: 'Wi-Fi', icon: Wifi },
  [PropertyAttribute.AirConditioning]: { label: 'Climatisation', icon: AcUnit },
  [PropertyAttribute.Heating]: { label: 'Chauffage', icon: Whatshot },
  [PropertyAttribute.PetsAllowed]: { label: 'Animaux acceptés', icon: Pets, color: '#4caf50' },
  [PropertyAttribute.Furnished]: { label: 'Meublé', icon: Checkroom },
  [PropertyAttribute.Pool]: { label: 'Piscine', icon: Pool, color: '#2196f3' },
  [PropertyAttribute.Garden]: { label: 'Jardin', icon: Yard, color: '#4caf50' },
  [PropertyAttribute.Balcony]: { label: 'Balcon', icon: Balcony },
  [PropertyAttribute.Terrace]: { label: 'Terrasse', icon: Deck },
  [PropertyAttribute.Elevator]: { label: 'Ascenseur', icon: Elevator },
  [PropertyAttribute.Security]: { label: 'Sécurité 24h', icon: Security },
  [PropertyAttribute.Gym]: { label: 'Salle de sport', icon: FitnessCenter },
  [PropertyAttribute.Laundry]: { label: 'Buanderie', icon: LocalLaundryService },
  [PropertyAttribute.Storage]: { label: 'Rangement', icon: Warehouse },
  [PropertyAttribute.Fireplace]: { label: 'Cheminée', icon: LocalFireDepartment, color: '#f57c00' },
  [PropertyAttribute.Dishwasher]: { label: 'Lave-vaisselle', icon: Kitchen },
  [PropertyAttribute.WashingMachine]: { label: 'Machine à laver', icon: LocalLaundryService },
  [PropertyAttribute.Tv]: { label: 'Télévision', icon: Tv },
  [PropertyAttribute.Accessibility]: { label: 'Accessible PMR', icon: AccessibleForward },
  [PropertyAttribute.SmokingAllowed]: { label: 'Fumeurs acceptés', icon: SmokeFree },
};

const attributeAliases: Record<string, string> = {
  // Wifi/internet variants
  wi_fi: PropertyAttribute.Wifi,
  internet: PropertyAttribute.Wifi,
  internet_access: PropertyAttribute.Wifi,

  // Pets variants
  pets: PropertyAttribute.PetsAllowed,
  pet_friendly: PropertyAttribute.PetsAllowed,
  animals: PropertyAttribute.PetsAllowed,
  animaux: PropertyAttribute.PetsAllowed,
  animaux_acceptes: PropertyAttribute.PetsAllowed,

  // Common backend/frontend wording variants
  air_conditioner: PropertyAttribute.AirConditioning,
  climatisation: PropertyAttribute.AirConditioning,
  furnished: PropertyAttribute.Furnished,
  meuble: PropertyAttribute.Furnished,
  meublé: PropertyAttribute.Furnished,
  securite: PropertyAttribute.Security,
  tv_room: PropertyAttribute.Tv,
};

function normalizeAttributeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '_');
}

function humanizeAttribute(value: string): string {
  const cleaned = value
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!cleaned) {
    return 'Équipement';
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

interface PropertyAttributesProps {
  attributes: string[];
  variant?: 'chips' | 'list' | 'compact';
  maxDisplay?: number;
  showTitle?: boolean;
}

export default function PropertyAttributes({
  attributes,
  variant = 'chips',
  maxDisplay,
  showTitle = false,
}: PropertyAttributesProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  const normalizedAttributes = attributes
    .map((attr) => {
      const normalized = normalizeAttributeKey(attr);
      const canonicalKey = attributeAliases[normalized] ?? normalized;
      const knownConfig = attributeConfig[canonicalKey];

      return {
        key: canonicalKey || attr,
        original: attr,
        config: knownConfig ?? {
          label: humanizeAttribute(attr),
          icon: CheckCircleOutline,
        },
      };
    })
    .filter((entry, index, arr) => arr.findIndex((item) => item.key === entry.key) === index);

  const displayAttributes = maxDisplay ? normalizedAttributes.slice(0, maxDisplay) : normalizedAttributes;
  const remainingCount = maxDisplay && normalizedAttributes.length > maxDisplay
    ? normalizedAttributes.length - maxDisplay
    : 0;

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {displayAttributes.map((entry) => {
          const { config } = entry;
          const IconComponent = config.icon;
          return (
            <Tooltip key={entry.key} title={config.label} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              >
                <IconComponent
                  sx={{ fontSize: 16, color: config.color || 'text.secondary' }}
                />
              </Box>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            +{remainingCount}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'list') {
    return (
      <Box>
        {showTitle && (
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Équipements & Services
          </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          {displayAttributes.map((entry) => {
            const { config } = entry;
            const IconComponent = config.icon;
            return (
              <Box key={entry.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: config.color ? `${config.color}15` : 'action.hover',
                  }}
                >
                  <IconComponent
                    sx={{ fontSize: 20, color: config.color || 'text.secondary' }}
                  />
                </Box>
                <Typography variant="body2">{config.label}</Typography>
              </Box>
            );
          })}
        </Box>
        {remainingCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Et {remainingCount} autre{remainingCount > 1 ? 's' : ''} équipement{remainingCount > 1 ? 's' : ''}
          </Typography>
        )}
      </Box>
    );
  }

  // Default: chips variant
  return (
    <Box>
      {showTitle && (
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Équipements & Services
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {displayAttributes.map((entry) => {
          const { config } = entry;
          const IconComponent = config.icon;
          return (
            <Chip
              key={entry.key}
              icon={<IconComponent sx={{ fontSize: 18, color: config.color }} />}
              label={config.label}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                borderColor: config.color || 'divider',
                '& .MuiChip-label': { fontWeight: 500 },
              }}
            />
          );
        })}
        {remainingCount > 0 && (
          <Chip
            label={`+${remainingCount}`}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, borderColor: 'divider' }}
          />
        )}
      </Box>
    </Box>
  );
}
