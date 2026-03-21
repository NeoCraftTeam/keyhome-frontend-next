'use client';

import { propertyAttributesService } from '@/services/property-attributes.service';
import { useQuery } from '@tanstack/react-query';
import * as MuiIcons from '@mui/icons-material';
import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, Slide, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import type { SvgIconComponent } from '@mui/icons-material';
import { forwardRef, useMemo, useState } from 'react';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function normalizeAttributeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '_');
}

const FALLBACK_ICON: SvgIconComponent = MuiIcons.CheckCircleOutline;

function humanizeAttribute(value: string): string {
  const cleaned = value.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) {
    return 'Équipement';
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

interface PropertyAttributesProps {
  attributes: string[];
  variant?: 'chips' | 'list' | 'compact' | 'preview';
  maxDisplay?: number;
  showTitle?: boolean;
}

export default function PropertyAttributes({
  attributes,
  variant = 'chips',
  maxDisplay,
  showTitle = false,
}: PropertyAttributesProps) {
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const { data: metadata } = useQuery({
    queryKey: ['property-attributes'],
    queryFn: propertyAttributesService.list,
    staleTime: 1000 * 60 * 10,
  });

  if (!attributes || attributes.length === 0) {
    return null;
  }

  const bySlug: Record<string, any> = metadata?.data ?? {};
  const grouped = metadata?.grouped ?? [];
  const fallbackSelectedByCategory = [
    {
      slug: 'autres',
      name: 'Autres',
      attributes: attributes.map((attribute) => ({
        value: attribute,
        label: humanizeAttribute(attribute),
        icon: 'CheckCircleOutline',
        admin_icon: 'heroicon-o-check-circle',
      })),
    },
  ];
  const selected = attributes
    .map((slug) => bySlug[slug] ?? bySlug[normalizeAttributeKey(slug)])
    .filter(Boolean);

  const selectedByCategory = grouped
    .map((category) => ({
      ...category,
      attributes: category.attributes.filter((item) =>
        selected.some((picked) => picked.value === item.value)
      ),
    }))
    .filter((category) => category.attributes.length > 0);
  const effectiveSelectedByCategory = selectedByCategory.length > 0 ? selectedByCategory : fallbackSelectedByCategory;

  const flatSelected = useMemo(
    () => effectiveSelectedByCategory.flatMap((category) =>
      category.attributes.map((attribute) => ({ ...attribute, category: category.name }))
    ),
    [effectiveSelectedByCategory]
  );

  const displayAttributes = maxDisplay ? flatSelected.slice(0, maxDisplay) : flatSelected;
  const remainingCount = maxDisplay && flatSelected.length > maxDisplay
    ? flatSelected.length - maxDisplay
    : 0;

  const getIcon = (iconName: string): SvgIconComponent => {
    const icon = (MuiIcons as Record<string, SvgIconComponent>)[iconName];
    return icon ?? FALLBACK_ICON;
  };

  const previewGrouped = useMemo(() => {
    const previewValues = new Set(displayAttributes.map((item) => item.value));
    return effectiveSelectedByCategory
      .map((category) => ({
        ...category,
        attributes: category.attributes.filter((item) => previewValues.has(item.value)),
      }))
      .filter((category) => category.attributes.length > 0);
  }, [displayAttributes, effectiveSelectedByCategory]);

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {displayAttributes.map((entry) => {
          const IconComponent = getIcon(entry.icon);
          return (
            <Tooltip key={entry.value} title={`${entry.category} · ${entry.label}`} arrow>
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
                  sx={{ fontSize: 16, color: 'text.secondary' }}
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

  if (variant === 'preview') {
    return (
      <>
        <Box>
          {showTitle && (
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Équipements & Services
            </Typography>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 1.25,
            }}
          >
            {displayAttributes.map((entry) => {
              const IconComponent = getIcon(entry.icon);
              return (
                <Box
                  key={entry.value}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 34,
                    px: 0.25,
                    py: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      minWidth: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 14, color: 'text.secondary' }} />
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                    {entry.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {remainingCount > 0 && (
            <Button
              onClick={() => setIsExpandedModalOpen(true)}
              size="small"
              sx={{
                mt: 1.25,
                textTransform: 'none',
                fontWeight: 600,
                px: 0.5,
              }}
            >
              Voir plus ({remainingCount} autres)
            </Button>
          )}
        </Box>

        <Dialog
          open={isExpandedModalOpen}
          onClose={() => setIsExpandedModalOpen(false)}
          fullWidth
          maxWidth="md"
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : { xs: 2, sm: 3 },
              mx: isMobile ? 0 : { xs: 1.5, sm: 2 },
            },
          }}
        >
          <DialogTitle sx={{ pb: 1.5, fontWeight: 700 }}>
            Tous les équipements
          </DialogTitle>
          <DialogContent
            sx={{
              pt: 0.5,
              pb: 2.5,
              overflowY: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {effectiveSelectedByCategory.map((category) => (
                <Box key={category.slug}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                  >
                    {category.name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                      gap: 1.1,
                    }}
                  >
                    {category.attributes.map((entry) => {
                      const IconComponent = getIcon(entry.icon);
                      return (
                        <Box
                          key={entry.value}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minHeight: 34,
                            px: 0.25,
                            py: 0.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              minWidth: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.paper',
                            }}
                          >
                            <IconComponent sx={{ fontSize: 14, color: 'text.secondary' }} />
                          </Box>
                          <Typography variant="body2">{entry.label}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (variant === 'list') {
    const totalCount = flatSelected.length;

    return (
      <>
        <Box>
          {showTitle && (
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
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
              const IconComponent = getIcon(entry.icon);
              return (
                <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 22, color: 'text.secondary' }} />
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{entry.label}</Typography>
                </Box>
              );
            })}
          </Box>

          <Button
            onClick={() => setIsExpandedModalOpen(true)}
            size="small"
            sx={{
              mt: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 0,
              color: 'text.primary',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              '&:hover': { bgcolor: 'transparent', textDecorationColor: 'primary.main' },
            }}
          >
            Voir les {totalCount} équipement{totalCount > 1 ? 's' : ''} ›
          </Button>
        </Box>

        {/* Airbnb-style slide-up fullscreen panel */}
        <Dialog
          open={isExpandedModalOpen}
          onClose={() => setIsExpandedModalOpen(false)}
          fullScreen
          TransitionComponent={SlideUpTransition}
          PaperProps={{ sx: { bgcolor: 'background.default' } }}
        >
          {/* Sticky header */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              bgcolor: 'background.default',
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: { xs: 2, sm: 3 },
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <IconButton
              onClick={() => setIsExpandedModalOpen(false)}
              aria-label="Retour"
              sx={{
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
              Équipements & Services
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 3, sm: 4 }, maxWidth: 720, mx: 'auto', width: '100%' }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              Ce que propose ce logement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {totalCount} équipement{totalCount > 1 ? 's' : ''} disponible{totalCount > 1 ? 's' : ''}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {effectiveSelectedByCategory.map((category, catIdx) => (
                <Box key={category.slug}>
                  {catIdx > 0 && <Divider sx={{ mb: 3 }} />}
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    {category.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {category.attributes.map((entry, entryIdx) => {
                      const IconComponent = getIcon(entry.icon);
                      return (
                        <Box key={entry.value}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              py: 1.75,
                            }}
                          >
                            <IconComponent sx={{ fontSize: 24, color: 'text.secondary', flexShrink: 0 }} />
                            <Typography variant="body1" fontWeight={500}>
                              {entry.label}
                            </Typography>
                          </Box>
                          {entryIdx < category.attributes.length - 1 && (
                            <Divider sx={{ ml: 6 }} />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Dialog>
      </>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Équipements & Services
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {previewGrouped.map((category) => (
          <Box key={category.slug}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              {category.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {category.attributes.map((entry) => {
                const IconComponent = getIcon(entry.icon);
                return (
                  <Chip
                    key={entry.value}
                    icon={<IconComponent sx={{ fontSize: 18 }} />}
                    label={entry.label}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      '& .MuiChip-label': { fontWeight: 500 },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        ))}
        {remainingCount > 0 && (
          <Chip
            label={`+${remainingCount}`}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, borderColor: 'divider', width: 'fit-content' }}
          />
        )}
      </Box>
    </Box>
  );
}
