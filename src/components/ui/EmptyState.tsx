'use client';

import { Inbox as InboxIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import NextLink from 'next/link';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { py: 3, iconBox: 40, iconFontSize: 20 },
  md: { py: 6, iconBox: 56, iconFontSize: 28 },
  lg: { py: 10, iconBox: 72, iconFontSize: 36 },
} as const;

export function EmptyState({ icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const { py, iconBox, iconFontSize } = SIZE_CONFIG[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py,
        px: 3,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: iconBox,
          height: iconBox,
          borderRadius: '50%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.disabled',
          flexShrink: 0,
        }}
      >
        {icon ?? <InboxIcon sx={{ fontSize: iconFontSize }} />}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>

      {action &&
        (action.href ? (
          <Button
            component={NextLink}
            href={action.href}
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            {action.label}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={action.onClick}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

export default EmptyState;
