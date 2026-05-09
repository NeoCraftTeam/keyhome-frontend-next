'use client';

import { Price } from '@/components/ui/Price';
import { brand } from '@/theme/tokens';
import AiIcon from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AlertIcon from '@mui/icons-material/NotificationsActive';
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

interface DigestAd {
  id: string;
  slug?: string;
  title: string;
  price?: number;
  city?: string;
}

interface DigestGroup {
  alert_id: string;
  alert_label: string;
  summary: string;
  ad_count: number;
  ads: DigestAd[];
}

interface SearchAlertDigestCardProps {
  message: string;
  totalAds: number;
  groups: DigestGroup[];
  isUnread: boolean;
}

function AdMiniRow({ ad }: { ad: DigestAd }) {
  const href = `/ads/${ad.slug ?? ad.id}`;

  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.5,
        py: 0.9,
        borderRadius: 1.5,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography
        variant="body2"
        noWrap
        sx={{ flex: 1, mr: 1, fontWeight: 500 }}
      >
        {ad.title}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
        {ad.city && (
          <Typography variant="caption" color="text.disabled" noWrap>
            {ad.city}
          </Typography>
        )}
        {ad.price != null && (
          <Typography
            variant="caption"
            fontWeight={700}
            color="primary.main"
            noWrap
          >
            <Price amountXAF={ad.price} />
          </Typography>
        )}
        <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
      </Stack>
    </Box>
  );
}

export default function SearchAlertDigestCard({
  message,
  totalAds: _totalAds,
  groups,
  isUnread,
}: SearchAlertDigestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMultipleGroups = groups.length > 1;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Summary row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          pr: { xs: 5, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: isUnread
              ? `${brand.primary}18`
              : 'action.disabledBackground',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <AlertIcon
            sx={{
              fontSize: 20,
              color: isUnread ? 'primary.main' : 'text.disabled',
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={isUnread ? 600 : 400}
            color={isUnread ? 'text.primary' : 'text.secondary'}
            sx={{ lineHeight: 1.45 }}
          >
            {message}
          </Typography>

          {/* Alert labels */}
          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.75}>
            {groups.map((g) => (
              <Chip
                key={g.alert_id}
                label={`${g.alert_label} (${g.ad_count})`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: `${brand.primary}12`,
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: `${brand.primary}30`,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Expand toggle */}
        <Tooltip title={expanded ? 'Réduire' : 'Voir les annonces'}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            sx={{ mt: 0.25, flexShrink: 0 }}
            aria-expanded={expanded}
            aria-label={
              expanded ? 'Réduire le digest' : 'Voir les annonces du digest'
            }
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded} timeout={220}>
        <Box sx={{ mt: 1.5, ml: { xs: 0, sm: '52px' } }}>
          {groups.map((group, gIdx) => (
            <Box key={group.alert_id} sx={{ mb: hasMultipleGroups ? 2 : 0 }}>
              {hasMultipleGroups && (
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {group.alert_label}
                </Typography>
              )}

              {/* AI summary */}
              {group.summary && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.75,
                    bgcolor: 'action.hover',
                    borderRadius: 1.5,
                    px: 1.25,
                    py: 0.9,
                    mb: 1,
                  }}
                >
                  <AiIcon
                    sx={{
                      fontSize: 14,
                      color: 'text.disabled',
                      mt: 0.15,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.5 }}
                  >
                    {group.summary}
                  </Typography>
                </Box>
              )}

              {/* Ad mini rows */}
              <Stack divider={<Divider sx={{ my: 0.25 }} />}>
                {group.ads.map((ad) => (
                  <AdMiniRow key={ad.id} ad={ad} />
                ))}
              </Stack>

              {group.ad_count > group.ads.length && (
                <Box
                  component={Link}
                  href="/search-alerts"
                  sx={{
                    display: 'block',
                    mt: 0.75,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  + {group.ad_count - group.ads.length} autre
                  {group.ad_count - group.ads.length > 1 ? 's' : ''} annonce
                  {group.ad_count - group.ads.length > 1 ? 's' : ''} →
                </Box>
              )}

              {hasMultipleGroups && gIdx < groups.length - 1 && (
                <Divider sx={{ mt: 1.5 }} />
              )}
            </Box>
          ))}

          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Box
              component={Link}
              href="/search-alerts"
              sx={{
                fontSize: '0.75rem',
                color: 'text.disabled',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' },
              }}
            >
              Gérer mes alertes →
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
