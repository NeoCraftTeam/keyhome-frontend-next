'use client';

import { PropertyAttribute } from '@/types';
import {
  AccessibleForward,
  AcUnit,
  Balcony,
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

  const displayAttributes = maxDisplay ? attributes.slice(0, maxDisplay) : attributes;
  const remainingCount = maxDisplay && attributes.length > maxDisplay ? attributes.length - maxDisplay : 0;

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {displayAttributes.map((attr) => {
          const config = attributeConfig[attr];
          if (!config) return null;
          const IconComponent = config.icon;
          return (
            <Tooltip key={attr} title={config.label} arrow>
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
          {displayAttributes.map((attr) => {
            const config = attributeConfig[attr];
            if (!config) return null;
            const IconComponent = config.icon;
            return (
              <Box key={attr} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        {displayAttributes.map((attr) => {
          const config = attributeConfig[attr];
          if (!config) return null;
          const IconComponent = config.icon;
          return (
            <Chip
              key={attr}
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
