import { adsService } from '@/services/ads.service';
import { useQuery } from '@tanstack/react-query';

export interface LandingStat {
  value: string; // Formatted display string e.g. "1\u202f250+"
  rawValue: number; // Raw number for count-up animation
  label: string;
  suffix: string; // '+' or other suffix after the number
}

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

  const stats: LandingStat[] = [
    {
      value: fmt(data?.ads_count),
      rawValue: data?.ads_count ?? 0,
      label: 'Annonces actives',
      suffix: '+',
    },
    {
      value: fmt(data?.cities_count),
      rawValue: data?.cities_count ?? 0,
      label: 'Villes couvertes',
      suffix: '+',
    },
    {
      value: fmt(data?.users_count),
      rawValue: data?.users_count ?? 0,
      label: 'Utilisateurs',
      suffix: '+',
    },
  ];

  const authStats: LandingStat[] = [
    {
      value: fmt(data?.ads_count),
      rawValue: data?.ads_count ?? 0,
      label: 'Annonces',
      suffix: '+',
    },
    {
      value: fmt(data?.cities_count),
      rawValue: data?.cities_count ?? 0,
      label: 'Villes',
      suffix: '+',
    },
    {
      value: fmt(data?.users_count || 500),
      rawValue: data?.users_count ?? 500,
      label: 'Agents',
      suffix: '+',
    },
  ];

  return { stats, authStats, isLoading, data };
}
