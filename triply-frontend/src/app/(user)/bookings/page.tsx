'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Filter, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api/bookings';
import { activitiesApi } from '@/lib/api/activities';
import { formatDate, formatCurrency, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ActivityBookingCard } from '@/components/activities/ActivityBookingCard';
import { SearchFiltersModal, SearchFiltersTriggerButton } from '@/components/filters';

const statusOptions = [
  { value: 'all', label: 'All Bookings' },
  { value: 'pending_deposit', label: 'Pending Deposit' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'dates_selected', label: 'Dates Selected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, statusFilter],
    queryFn: () => bookingsApi.getMyBookings(
      page, 
      10, 
      statusFilter === 'all' ? undefined : statusFilter
    ),
    enabled: isAuthenticated,
  });

  const {
    data: activityBookingsData,
    isLoading: activityBookingsLoading,
  } = useQuery({
    queryKey: ['my-activity-bookings', 1],
    queryFn: () => activitiesApi.getMyActivityBookings(1, 5),
    enabled: isAuthenticated && !authLoading,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <SearchFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Filter bookings"
        description="Show your destination bookings by status."
        fields={[]}
        onClearAll={() => setStatusFilter('all')}
        clearLabel="Reset to all"
        applyLabel="Done"
      >
        <div className="space-y-2">
          <Label htmlFor="booking-status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="booking-status-filter" className="h-11 w-full">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SearchFiltersModal>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">Manage your travel bookings</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SearchFiltersTriggerButton
              onClick={() => setFilterModalOpen(true)}
              activeCount={statusFilter !== 'all' ? 1 : 0}
              label="Filters"
            />
            <Button asChild>
              <Link href="/destinations">New Booking</Link>
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-24 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter !== 'all' 
                  ? 'Try changing the filter or create a new booking'
                  : 'Start your journey by exploring our destinations'}
              </p>
              <Button asChild>
                <Link href="/destinations">Explore Destinations</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data?.data.map((booking) => {
              const destination = booking.destinationId as Destination;
              return (
                <Card 
                  key={booking._id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Image */}
                      <div className="w-full md:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {destination?.thumbnailImage ? (
                          <img
                            src={destination.thumbnailImage}
                            alt={destination.name || 'Destination'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-xl font-semibold mb-1">
                              {destination?.name || 'Destination'}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {booking.bookingReference}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Booked: {formatDate(booking.createdAt)}</span>
                          </div>
                          {booking.travelDates?.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Travel: {formatDate(booking.travelDates.startDate)} - {formatDate(booking.travelDates.endDate!)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">
                              {formatCurrency(booking.depositPayment.amount, booking.depositPayment.currency)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {booking.status === 'deposit_paid' && (
                            <p className="text-sm text-primary">
                              Ready to select dates!
                            </p>
                          )}
                          {booking.status === 'dates_selected' && (
                            <p className="text-sm text-amber-600">
                              Awaiting confirmation
                            </p>
                          )}
                          {booking.status === 'confirmed' && (
                            <p className="text-sm text-green-600">
                              Your trip is confirmed!
                            </p>
                          )}
                          {!['deposit_paid', 'dates_selected', 'confirmed'].includes(booking.status) && (
                            <div />
                          )}

                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/bookings/${booking._id}`}>
                              View Details
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Activity bookings */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">My Activity Bookings</h2>
              <p className="text-muted-foreground">Track your booked activities</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/bookings/activity">View all</Link>
            </Button>
          </div>

          {activityBookingsLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : (activityBookingsData?.data?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">No activity bookings found</h3>
                <p className="text-muted-foreground mb-6">Book an activity and it will appear here after payment.</p>
                <Button asChild>
                  <Link href="/activities">Explore Activities</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activityBookingsData?.data.map((booking) => (
                <ActivityBookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {data.meta.totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

