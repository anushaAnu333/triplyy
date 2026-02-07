'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { merchantActivitiesApi } from '@/lib/api/activities';
import AvailabilityCalendar, { AvailabilityData } from '@/components/availability/AvailabilityCalendar';

export default function MerchantAvailabilityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedActivity, setSelectedActivity] = useState<string>('');

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['merchant-activities'],
    queryFn: () => merchantActivitiesApi.getMyActivities(),
    enabled: isAuthenticated && user?.role === 'merchant',
  });

  const approvedActivities = activities?.filter(a => a.status === 'approved') || [];

  const { data: availabilityResponse, isLoading: loadingAvailability } = useQuery({
    queryKey: ['merchant-activity-availability', selectedActivity],
    queryFn: async () => {
      if (!selectedActivity) return null;
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      return merchantActivitiesApi.getActivityAvailability(selectedActivity, start, end);
    },
    enabled: !!selectedActivity,
  });

  // Transform data to match AvailabilityCalendar interface
  const availability: AvailabilityData[] = availabilityResponse?.availability?.map(item => ({
    date: item.date,
    availableSlots: item.availableSlots,
    bookedSlots: item.bookedSlots,
    isAvailable: item.isAvailable,
    isBlocked: !item.isAvailable,
  })) || [];

  const handleUpdateSlots = async (dates: string[], slots: number) => {
    if (!selectedActivity) throw new Error('No activity selected');
    await merchantActivitiesApi.updateActivitySlots(selectedActivity, dates, slots);
    queryClient.invalidateQueries({ queryKey: ['merchant-activity-availability'] });
  };

  const handleBlockDates = async (dates: string[], isBlocked: boolean) => {
    if (!selectedActivity) throw new Error('No activity selected');
    await merchantActivitiesApi.blockActivityDates(selectedActivity, dates, isBlocked);
    queryClient.invalidateQueries({ queryKey: ['merchant-activity-availability'] });
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'merchant')) {
      router.push('/merchant/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'merchant') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activityItems = approvedActivities.map(activity => ({
    _id: activity._id,
    name: activity.title,
  }));

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Activity Availability</h1>
          <p className="text-muted-foreground">
            Manage dates and slots for your activities
          </p>
        </div>

        {activityItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No approved activities available. Please add and get approval for activities first.
          </div>
        ) : (
          <AvailabilityCalendar
            items={activityItems}
            selectedItemId={selectedActivity}
            onItemChange={setSelectedActivity}
            availability={availability}
            isLoadingAvailability={loadingAvailability}
            onUpdateSlots={handleUpdateSlots}
            onBlockDates={handleBlockDates}
            title="Availability Calendar"
            description="Select dates to manage availability"
            itemLabel="Activity"
            itemPlaceholder="Select an activity"
            emptyMessage="Please select an activity to manage availability"
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['merchant-activity-availability'] });
            }}
          />
        )}
      </div>
    </div>
  );
}
