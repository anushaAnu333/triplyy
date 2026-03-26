'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { adminActivitiesApi } from '@/lib/api/activities';
import { ActivityDestinationDetailView } from '@/components/activities/ActivityDestinationDetailView';

export default function AdminActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const id = params.id as string | undefined;

  const { data: activity, isLoading } = useQuery({
    queryKey: ['admin-activity', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing id');
      return adminActivitiesApi.getById(id);
    },
    enabled: isAuthenticated && user?.role === 'admin' && !!id,
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

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

  return <ActivityDestinationDetailView activity={activity} enableBooking={false} backHref="/admin/activities" />;
}

