import { useQuery } from '@tanstack/react-query';
import { destinationsApi, DestinationFilters } from '@/lib/api/destinations';

export function useDestinations(filters?: DestinationFilters) {
  return useQuery({
    queryKey: ['destinations', filters],
    queryFn: () => destinationsApi.getAll(filters),
  });
}

export function useDestination(slug: string) {
  return useQuery({
    queryKey: ['destination', slug],
    queryFn: () => destinationsApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useDestinationAvailability(
  destinationId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['destination-availability', destinationId, startDate, endDate],
    queryFn: () => destinationsApi.getAvailability(destinationId, startDate, endDate),
    enabled: !!destinationId,
  });
}

