import type { SxProps, Theme } from '@mui/material/styles';
import { NAV_LIST_ICON_GLYPH_PX } from '@/lib/navVisualMetrics';
import { PWA_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/lib/pwaBottomNavConstants';
import { khSafeAreaBottomSx } from '@/lib/safe-area-insets';

/**
 * Shared desktop-class alignment for KeyHome bottom tab shells (customer + bailleur).
 * Keeps icons on one baseline and labels centred with room for longer French words.
 */
export function bottomNavigationPwaShellSx(): SxProps<Theme> {
  return {
    height: `calc(${PWA_BOTTOM_NAV_INNER_HEIGHT_PX}px + ${khSafeAreaBottomSx})`,
    paddingBottom: khSafeAreaBottomSx,
    bgcolor: 'background.paper',
    alignItems: 'stretch',
    '& .MuiBottomNavigationAction-root': {
      flex: '1 1 0',
      minWidth: 0,
      maxWidth: 'none',
      px: 0.25,
      pt: 1,
      pb: 0.625,
      gap: 0.25,
      color: 'text.secondary',
      justifyContent: 'flex-start',
      position: 'relative',
      '&:active': { transform: 'scale(0.97)' },
      '&.Mui-selected': {
        color: 'primary.main',
      },
    },
    '& .MuiBottomNavigationAction-icon': {
      minHeight: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 0,
      '& .MuiSvgIcon-root': {
        fontSize: NAV_LIST_ICON_GLYPH_PX,
      },
      '& img': {
        width: NAV_LIST_ICON_GLYPH_PX,
        height: NAV_LIST_ICON_GLYPH_PX,
        objectFit: 'contain',
        display: 'block',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.62rem',
      fontWeight: 500,
      lineHeight: 1.25,
      textAlign: 'center',
      whiteSpace: 'normal',
      hyphens: 'auto',
      opacity: 1,
      maxWidth: '100%',
      transition: 'font-weight 0.2s ease',
      '&.Mui-selected': {
        fontSize: '0.62rem',
        fontWeight: 700,
      },
    },
    '& .MuiBottomNavigationAction-root.Mui-selected': {
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 22,
        height: 3,
        borderRadius: '3px 3px 0 0',
        bgcolor: 'primary.main',
      },
    },
  };
}
