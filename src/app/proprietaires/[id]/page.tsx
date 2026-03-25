'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usersService } from '@/services/users.service';
import { useQuery } from '@tanstack/react-query';
import { CircularProgress, Box } from '@mui/material';

export default function ProprietairesRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['user-public-profile-redirect', id],
    queryFn: () => usersService.getPublicProfile(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const username = data?.data?.username;
    router.replace(`/bailleurs/${username ?? id}`);
  }, [data, id, router]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}
