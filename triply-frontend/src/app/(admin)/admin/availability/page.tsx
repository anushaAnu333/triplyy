'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { destinationsApi } from '@/lib/api/destinations';
import api from '@/lib/api/axios';
import AvailabilityCalendar, { AvailabilityData } from '@/components/availability/AvailabilityCalendar';

interface DestinationAvailabilityData {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  isBlocked: boolean;
}

export default function AdminAvailabilityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDestination, setSelectedDestination] = useState<string>('');

  const { data: destinations } = useQuery({
    queryKey: ['destinations-list'],
    queryFn: () => destinationsApi.getAll({}),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: rawAvailability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['availability', selectedDestination],
    queryFn: async () => {
      if (!selectedDestination) return [];
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const response = await api.get(`/availability/${selectedDestination}?startDate=${start}&endDate=${end}`);
      return response.data.data as DestinationAvailabilityData[];
    },
    enabled: !!selectedDestination,
  });

  // Transform data to match AvailabilityCalendar interface
  const availability: AvailabilityData[] = rawAvailability?.map(item => ({
    date: item.date,
    availableSlots: item.totalSlots || item.availableSlots,
    bookedSlots: item.bookedSlots,
    isBlocked: item.isBlocked,
  })) || [];

  const handleUpdateSlots = async (dates: string[], slots: number) => {
    await api.put(`/availability/${selectedDestination}/bulk`, {
        dates,
        totalSlots: slots,
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  const handleBlockDates = async (dates: string[], isBlocked: boolean) => {
    await api.put(`/availability/${selectedDestination}/block`, {
        dates,
      isBlocked,
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const destinationItems = destinations?.data?.map((dest: any) => ({
    _id: dest._id,
    name: dest.name?.en || dest.name || 'Unnamed Destination',
  })) || [];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Availability Calendar</h1>
            <p className="text-muted-foreground">Manage destination availability and slots</p>
          </div>
          
        {destinationItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Destinations</h3>
              <p className="text-muted-foreground">
                No destinations available to manage
              </p>
            </CardContent>
          </Card>
        ) : (
          <AvailabilityCalendar
            items={destinationItems}
            selectedItemId={selectedDestination}
            onItemChange={setSelectedDestination}
            availability={availability}
            isLoadingAvailability={loadingAvailability}
            onUpdateSlots={handleUpdateSlots}
            onBlockDates={handleBlockDates}
            title="Availability Calendar"
            description="Manage destination availability and slots"
            itemLabel="Destination"
            itemPlaceholder="Select a destination"
            emptyMessage="Please select a destination to manage availability"
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['availability'] });
            }}
          />
        )}
      </div>
    </div>
  );
}

