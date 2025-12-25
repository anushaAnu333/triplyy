import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, CreateBookingData } from '@/lib/api/bookings';
import { useToast } from '@/components/ui/use-toast';

export function useMyBookings(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ['my-bookings', page, limit, status],
    queryFn: () => bookingsApi.getMyBookings(page, limit, status),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBookingData) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.message || 'Unable to create booking',
        variant: 'destructive',
      });
    },
  });
}

export function useSelectDates(bookingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ startDate, endDate, isFlexible }: {
      startDate: string;
      endDate: string;
      isFlexible?: boolean;
    }) => bookingsApi.selectDates(bookingId, startDate, endDate, isFlexible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: 'Dates Selected',
        description: 'Your travel dates have been submitted for confirmation.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to select dates',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelBooking(bookingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    },
  });
}

