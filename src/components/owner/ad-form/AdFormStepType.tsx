'use client';

import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import SellIcon from '@mui/icons-material/Sell';
import StoreIcon from '@mui/icons-material/Store';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';

import {
  AD_TYPE_CATEGORIES,
  AdTypeCategory,
  TRANSACTION_TYPES,
} from './ad-type-categories';
import type { AdTypeCategoryConfig } from './ad-type-categories';
import { sectionSx, sectionTitleSx } from './types';

/* ------------------------------------------------------------------ */
/*  Icon resolvers                                                     */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Home: HomeIcon,
  Landscape: LandscapeIcon,
  DirectionsCar: DirectionsCarIcon,
  Store: StoreIcon,
};

const TRANSACTION_ICONS: Record<string, React.ElementType> = {
  Key: VpnKeyIcon,
  Sell: SellIcon,
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AdFormStepTypeProps {
  selectedCategory: AdTypeCategory | null;
  selectedTransactionType: string;
  selectedTypeId: string;
  adTypes: Array<{ id: string; name: string; desc: string }>;
  onCategoryChange: (category: AdTypeCategory) => void;
  onTransactionTypeChange: (type: string) => void;
  onTypeIdChange: (typeId: string) => void;
  errors: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const chipRow = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto' as const,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdFormStepType({
  selectedCategory,
  selectedTransactionType,
  selectedTypeId,
  adTypes,
  onCategoryChange,
  onTransactionTypeChange,
  onTypeIdChange,
  errors,
}: AdFormStepTypeProps) {
  const activeCategoryConfig: AdTypeCategoryConfig | undefined =
    AD_TYPE_CATEGORIES.find((c) => c.id === selectedCategory);

  const showSubtypes =
    activeCategoryConfig &&
    activeCategoryConfig.available &&
    activeCategoryConfig.subtypes.length > 1;

  /* Match a subtype name to a backend adType id */
  const resolveTypeId = (subtypeName: string) => {
    const normalized = subtypeName.toLowerCase().trim();
    return (
      adTypes.find((t) => t.name.toLowerCase().trim() === normalized)?.id ?? ''
    );
  };

  /* When a category is selected: auto-select type if only 1 subtype */
  const handleCategorySelect = (cat: AdTypeCategoryConfig) => {
    if (!cat.available) return;
    onCategoryChange(cat.id);
    if (cat.subtypes.length === 1) {
      onTypeIdChange(resolveTypeId(cat.subtypes[0]));
    } else {
      onTypeIdChange('');
    }
  };

  return (
    <Paper elevation={0} sx={sectionSx}>
      {/* ─── Section 1 : Transaction Type ─── */}
      <Typography variant="h6" sx={{ ...sectionTitleSx, fontSize: '1.125rem' }}>
        <VpnKeyIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Type de transaction
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        {TRANSACTION_TYPES.map((tx, i) => {
          const Icon = TRANSACTION_ICONS[tx.icon];
          const selected = selectedTransactionType === tx.value;
          return (
            <Box
              key={tx.value}
              component={motion.div}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTransactionTypeChange(tx.value)}
              sx={{
                flex: 1,
                cursor: 'pointer',
                borderRadius: 3,
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : 'background.paper',
                color: selected ? '#fff' : 'text.primary',
                boxShadow: selected
                  ? '0 4px 14px rgba(246,71,95,0.25)'
                  : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: selected ? 'primary.main' : 'action.hover',
                },
              }}
            >
              {Icon && (
                <Icon
                  sx={{
                    fontSize: 28,
                    color: selected ? '#fff' : 'text.secondary',
                  }}
                />
              )}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  {tx.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: selected
                      ? 'rgba(255,255,255,0.85)'
                      : 'text.secondary',
                  }}
                >
                  {tx.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {errors.transaction_type && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0.5 }}>
          {errors.transaction_type}
        </Typography>
      )}

      {/* ─── Section 2 : Ad Type Category ─── */}
      <Typography
        variant="h6"
        sx={{ ...sectionTitleSx, fontSize: '1.125rem', mt: 4 }}
      >
        <HomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Catégorie de bien
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 1,
        }}
      >
        {AD_TYPE_CATEGORIES.map((cat, i) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          const selected = selectedCategory === cat.id;
          const unavailable = !cat.available;

          return (
            <Box
              key={cat.id}
              component={motion.div}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              whileHover={unavailable ? undefined : { scale: 1.03 }}
              whileTap={unavailable ? undefined : { scale: 0.97 }}
              onClick={() => handleCategorySelect(cat)}
              sx={{
                position: 'relative',
                cursor: unavailable ? 'default' : 'pointer',
                borderRadius: 3,
                p: { xs: 2.5, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1,
                border: '2px solid',
                borderColor: selected ? cat.color : 'divider',
                bgcolor: selected ? alpha(cat.color, 0.08) : 'background.paper',
                boxShadow: selected
                  ? `0 0 0 3px ${alpha(cat.color, 0.18)}`
                  : 'none',
                opacity: unavailable ? 0.55 : 1,
                transition:
                  'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
                overflow: 'hidden',
                '&:hover': unavailable ? {} : { borderColor: cat.color },
              }}
            >
              {Icon && (
                <Icon
                  sx={{
                    fontSize: 44,
                    color: selected ? cat.color : 'text.secondary',
                    transition: 'color 0.2s',
                  }}
                />
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {cat.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', lineHeight: 1.3 }}
              >
                {cat.description}
              </Typography>

              {unavailable && (
                <Chip
                  label="Bientôt disponible"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: alpha('#000', 0.06),
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* show type_id error when no category is picked yet */}
      {!selectedCategory && errors.type_id && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0.5 }}>
          {errors.type_id}
        </Typography>
      )}

      {/* ─── Section 3 : Sub-type Chips ─── */}
      <AnimatePresence mode="wait">
        {showSubtypes && activeCategoryConfig && (
          <Box
            component={motion.div}
            key={activeCategoryConfig.id}
            variants={chipRow}
            initial="hidden"
            animate="visible"
            exit="exit"
            sx={{ mt: 3, overflow: 'hidden' }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}
            >
              Précisez le type
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              {activeCategoryConfig.subtypes.map((subtype) => {
                const typeId = resolveTypeId(subtype);
                const isSelected = selectedTypeId === typeId && typeId !== '';
                const catColor = activeCategoryConfig.color;

                return (
                  <Chip
                    key={subtype}
                    label={subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => onTypeIdChange(typeId)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      py: 2.2,
                      px: 0.5,
                      borderRadius: 2,
                      borderColor: isSelected ? catColor : 'divider',
                      bgcolor: isSelected ? catColor : 'transparent',
                      color: isSelected ? '#fff' : 'text.primary',
                      '&:hover': {
                        bgcolor: isSelected ? catColor : alpha(catColor, 0.1),
                      },
                      transition:
                        'background-color 0.2s, border-color 0.2s, color 0.2s',
                    }}
                  />
                );
              })}
            </Box>

            {errors.type_id && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: 'block' }}
              >
                {errors.type_id}
              </Typography>
            )}
          </Box>
        )}
      </AnimatePresence>

      {/* show type_id error after category with single subtype (auto-resolved but might still fail) */}
      {selectedCategory &&
        !showSubtypes &&
        activeCategoryConfig?.available &&
        errors.type_id && (
          <Typography variant="caption" color="error" sx={{ mt: 1, ml: 0.5 }}>
            {errors.type_id}
          </Typography>
        )}
    </Paper>
  );
}
