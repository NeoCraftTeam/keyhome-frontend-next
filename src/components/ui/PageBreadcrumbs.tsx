'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Show a back arrow button. Defaults to false — nav bar handles back on mobile/PWA. */
  showBack?: boolean;
}

/**
 * Accessible breadcrumb navigation with an optional back button.
 * On mobile, shows a compact back arrow + current page label.
 * On desktop, shows the full breadcrumb trail.
 */
export default function PageBreadcrumbs({
  items,
  showBack = false,
}: PageBreadcrumbsProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (items.length === 0) {
    return null;
  }

  const lastItem = items[items.length - 1];
  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1.5,
        }}
        aria-label="Navigation"
      >
        {showBack && (
          <IconButton
            size="small"
            onClick={() => router.back()}
            aria-label="Retour"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '50%',
              width: 34,
              height: 34,
              mr: 0.5,
              transition: 'background-color 0.15s ease',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {parentItem && (
          <Typography
            component={parentItem.href ? NextLink : 'span'}
            href={parentItem.href}
            variant="body2"
            fontWeight={600}
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {parentItem.label}
          </Typography>
        )}
        {parentItem && (
          <NavigateNextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
        <Typography
          variant="body2"
          fontWeight={700}
          color="text.primary"
          noWrap
        >
          {lastItem.label}
        </Typography>
      </Box>
    );
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
      aria-label="fil d'Ariane"
      sx={{ mb: 2 }}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        if (isLast) {
          return (
            <Typography
              key={idx}
              variant="body2"
              fontWeight={600}
              color="text.primary"
              noWrap
              sx={{ maxWidth: 260 }}
            >
              {item.label}
            </Typography>
          );
        }

        return item.href ? (
          <Link
            key={idx}
            component={NextLink}
            href={item.href}
            underline="hover"
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, '&:hover': { color: 'primary.main' } }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography
            key={idx}
            variant="body2"
            color="text.secondary"
            fontWeight={500}
          >
            {item.label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
}
