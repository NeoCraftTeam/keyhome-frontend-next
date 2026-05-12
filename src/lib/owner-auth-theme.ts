import { alpha } from '@mui/material/styles';
import { brandAgent, dark } from '@/theme/tokens';

/** Hero scrim for owner email OTP and profile completion layouts. */
export const ownerAuthHeroScrim = `linear-gradient(to bottom, ${alpha(
  brandAgent.primaryDark,
  0.28
)} 0%, ${alpha(dark.bg, 0.82)} 100%)`;
