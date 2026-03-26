'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { activitiesApi } from '@/lib/api/activities';
import { ActivityDestinationDetailView } from '@/components/activities/ActivityDestinationDetailView';
import { useAuth } from '@/context/AuthContext';

export default function ActivityDetailPage() {
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const id = params.id as string | undefined;

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing id');
      return activitiesApi.getById(id);
    },
    enabled: !authLoading && !!id,
  });

  // For user-facing activities, keep browsing allowed even when logged out.
  // The booking button will redirect to login if needed.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    toast({ title: 'Activity not found', variant: 'destructive' });
    return null;
  }

  return (
    <ActivityDestinationDetailView
      activity={activity}
      enableBooking={true}
      backHref="/activities"
    />
  );
}

