import { adsService } from '@/services/ads.service';
import { useQuery } from '@tanstack/react-query';

export function useLandingStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => adsService.getStats(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const fmt = (n: number | undefined): string => {
    if (!n) return '...';
    if (n >= 1000) {
      return new Intl.NumberFormat('fr-FR').format(n) + '+';
    }
    return n + '+';
  };

  const stats = [
    { value: fmt(data?.ads_count), label: 'Annonces actives' },
    { value: fmt(data?.cities_count), label: 'Villes couvertes' },
    { value: fmt(data?.users_count), label: 'Utilisateurs' },
  ];

  const authStats = [
    { value: fmt(data?.ads_count), label: 'Annonces' },
    { value: fmt(data?.cities_count), label: 'Villes' },
    { value: fmt(data?.users_count || 500), label: 'Agents' }, // Keep agents fallback if API doesn't provide it
  ];

  return { stats, authStats, isLoading, data };
}
