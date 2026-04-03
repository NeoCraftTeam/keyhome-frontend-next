'use client';

import { getPasswordStrength } from '@/lib/password-strength';
import { Box, LinearProgress, Typography } from '@mui/material';

/**
 * Visual indicator for password strength.
 * Renders nothing when the password is empty.
 */
export default function PasswordStrengthBar({
  password,
}: {
  password: string;
}) {
  if (!password) {
    return null;
  }

  const { score, label, color } = getPasswordStrength(password);

  return (
    <Box sx={{ mb: 2 }}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{ color, fontWeight: 600, mt: 0.5, display: 'block' }}
      >
        Force : {label}
      </Typography>
    </Box>
  );
}
