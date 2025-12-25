'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api/bookings';
import { formatDate, formatCurrency, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 5),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your bookings and explore new destinations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-triply-coral to-triply-coral/80 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Bookings</p>
                  <p className="text-3xl font-bold">
                    {bookingsData?.data.filter(b => 
                      ['deposit_paid', 'dates_selected', 'confirmed'].includes(b.status)
                    ).length || 0}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-triply-teal to-triply-teal/80 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Confirmed Trips</p>
                  <p className="text-3xl font-bold">
                    {bookingsData?.data.filter(b => b.status === 'confirmed').length || 0}
                  </p>
                </div>
                <MapPin className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Link href="/destinations" className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Booking</p>
                  <p className="text-sm text-muted-foreground">Explore destinations</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your latest travel bookings</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/bookings">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
                    <div className="w-20 h-20 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bookingsData?.data.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your adventure by exploring our destinations
                </p>
                <Button asChild>
                  <Link href="/destinations">Explore Destinations</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingsData?.data.map((booking) => {
                  const destination = booking.destinationId as Destination;
                  return (
                    <Link
                      key={booking._id}
                      href={`/bookings/${booking._id}`}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                        {destination?.thumbnailImage && (
                          <img
                            src={destination.thumbnailImage}
                            alt={destination.name.en}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {destination?.name?.en || 'Destination'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {booking.bookingReference}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(booking.createdAt)}
                          </span>
                          <span>
                            {formatCurrency(booking.depositPayment.amount, booking.depositPayment.currency)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

