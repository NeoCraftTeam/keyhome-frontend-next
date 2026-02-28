import { Box, Skeleton } from '@mui/material';

/**
 * Auth loading skeleton — shown instantly while the login/register page JS loads.
 * Mimics the auth layout: left image area + right form area.
 */
export default function AuthLoading() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left image placeholder (hidden on mobile) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
        }}
      >
        <Skeleton
          variant="rectangular"
          sx={{ height: '100%', bgcolor: 'grey.200' }}
        />
      </Box>

      {/* Right form placeholder */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Title */}
          <Skeleton variant="text" width="60%" height={48} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 4 }} />

          {/* Email field */}
          <Skeleton
            variant="rounded"
            height={56}
            sx={{ borderRadius: 1, mb: 2 }}
          />

          {/* Password field */}
          <Skeleton
            variant="rounded"
            height={56}
            sx={{ borderRadius: 1, mb: 3 }}
          />

          {/* Submit button */}
          <Skeleton
            variant="rounded"
            height={48}
            sx={{ borderRadius: 2, mb: 3 }}
          />

          {/* Social buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="circular"
                width={48}
                height={48}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
