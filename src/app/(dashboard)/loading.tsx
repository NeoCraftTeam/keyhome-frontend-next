import { Box, Container, Grid, Skeleton } from '@mui/material';

/**
 * Dashboard loading skeleton — shown instantly while the page JS downloads.
 * Mimics the home page layout: nav placeholder + category pills + ad cards grid.
 */
export default function DashboardLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar placeholder */}
      <Skeleton
        variant="rectangular"
        height={64}
        sx={{ bgcolor: 'grey.100' }}
      />

      {/* Category pills placeholder */}
      <Container maxWidth="lg" sx={{ pt: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, overflow: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={100}
              height={36}
              sx={{ borderRadius: 5, flexShrink: 0 }}
            />
          ))}
        </Box>
      </Container>

      {/* Ad cards grid skeleton */}
      <Container maxWidth="xl" sx={{ mt: 2, px: { xs: 2, sm: 3, md: 4 } }}>
        <Skeleton variant="text" width={200} height={36} sx={{ mb: 2 }} />
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
              <Box>
                <Skeleton
                  variant="rounded"
                  height={180}
                  sx={{ borderRadius: 2, mb: 1 }}
                />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={20}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
