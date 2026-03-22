import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface Testimonial {
  id: string;
  display_name: string;
  initials: string;
  role: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface TestimonialsResponse {
  data: Testimonial[];
  meta: {
    average_rating: number;
    total_count: number;
  };
}

async function fetchTestimonials(): Promise<TestimonialsResponse> {
  const { data } = await api.get<TestimonialsResponse>('/stats/testimonials');
  return data;
}

export function useLandingTestimonials() {
  const { data, isLoading } = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: fetchTestimonials,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 1,
  });

  return {
    testimonials: data?.data ?? [],
    averageRating: data?.meta.average_rating,
    totalCount: data?.meta.total_count,
    isLoading,
  };
}
