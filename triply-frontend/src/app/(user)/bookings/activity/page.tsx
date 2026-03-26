'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { activitiesApi, type ActivityBooking } from '@/lib/api/activities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, MapPin } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ActivityBookingCard } from '@/components/activities/ActivityBookingCard';

export default function MyActivityBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['my-activity-bookings', page],
    queryFn: () => activitiesApi.getMyActivityBookings(page, limit),
    enabled: isAuthenticated && !authLoading,
  });

  if (!authLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  const bookings = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">My Activity Bookings</h1>
            <p className="text-muted-foreground">Track your booked activities</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/activities">Browse Activities</a>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No activity bookings found</h3>
              <p className="text-muted-foreground mb-6">
                Book an activity and it will appear here after payment.
              </p>
              <Button asChild>
                <a href="/activities">Explore Activities</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              return <ActivityBookingCard key={booking._id} booking={booking} />;
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

