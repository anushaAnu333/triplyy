'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Users, 
  CreditCard, MessageSquare, AlertCircle, Check, X, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { bookingsApi } from '@/lib/api/bookings';
import { formatDate, formatCurrency, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DatePickerModal } from '@/components/booking/DatePickerModal';
import { ActivityBooking } from '@/lib/api/bookings';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: isAuthenticated && !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
        <Button asChild>
          <Link href="/bookings">View All Bookings</Link>
        </Button>
      </div>
    );
  }

  const destination = booking.destinationId as Destination;
  const canSelectDates = booking.status === 'deposit_paid';
  const canCancel = ['pending_deposit', 'deposit_paid', 'dates_selected'].includes(booking.status);

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/bookings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Booking Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {destination?.thumbnailImage ? (
                      <img
                        src={destination.thumbnailImage}
                        alt={destination.name?.en}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold">
                          {destination?.name?.en || 'Destination'}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{destination?.country}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Booking Reference</p>
                        <p className="font-mono font-semibold">{booking.bookingReference}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Travellers</p>
                        <p className="font-semibold">{booking.numberOfTravellers}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold">
                          {destination?.duration?.days || 0} Days / {destination?.duration?.nights || 0} Nights
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booked On</p>
                        <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Travel Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.travelDates?.startDate ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {format(new Date(booking.travelDates.startDate), 'PPP')} - {format(new Date(booking.travelDates.endDate!), 'PPP')}
                      </p>
                      {booking.travelDates.isFlexible && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Flexible dates selected
                        </p>
                      )}
                    </div>
                    {booking.status === 'dates_selected' && (
                      <div className="text-right">
                        <p className="text-amber-600 font-medium">Awaiting Confirmation</p>
                        <p className="text-sm text-muted-foreground">Admin will confirm shortly</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground">
                        {canSelectDates
                          ? 'Select your travel dates when ready'
                          : 'Travel dates will be available after deposit payment'}
                      </p>
                      {booking.calendarUnlockedUntil && (
                        <p className="text-sm text-primary mt-1">
                          Calendar unlocked until {formatDate(booking.calendarUnlockedUntil)}
                        </p>
                      )}
                    </div>
                    {canSelectDates && (
                      <Button onClick={() => setShowDatePicker(true)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Select Dates
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-3 border-b">
                  <span>Deposit Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.depositPayment.amount, booking.depositPayment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span>Payment Status</span>
                  <span className={`font-semibold ${
                    booking.depositPayment.paymentStatus === 'completed' 
                      ? 'text-green-600' 
                      : booking.depositPayment.paymentStatus === 'failed'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}>
                    {booking.depositPayment.paymentStatus.charAt(0).toUpperCase() + 
                     booking.depositPayment.paymentStatus.slice(1)}
                  </span>
                </div>
                {booking.depositPayment.paidAt && (
                  <div className="flex items-center justify-between py-3">
                    <span>Paid On</span>
                    <span>{formatDate(booking.depositPayment.paidAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Requests */}
            {booking.specialRequests && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Special Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{booking.specialRequests}</p>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {booking.status === 'rejected' && booking.rejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{booking.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Linked Activities Section */}
            {booking.linkedActivityBookings && booking.linkedActivityBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Included Activities
                  </CardTitle>
                  <CardDescription>
                    Activities added to this booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {booking.linkedActivityBookings.map((activityBooking: ActivityBooking) => {
                      const activity = activityBooking.activityId as any;
                      return (
                        <div
                          key={activityBooking._id}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          {activity?.photos?.[0] && (
                            <img
                              src={activity.photos[0]}
                              alt={activity.title}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{activity?.title || 'Activity'}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity?.location}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(activityBooking.selectedDate), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {activityBooking.numberOfParticipants} participant(s)
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(activityBooking.payment.amount, activityBooking.payment.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activityBooking.payment.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="lg:w-80">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canSelectDates && (
                  <Button className="w-full" onClick={() => setShowDatePicker(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Select Travel Dates
                  </Button>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/destinations/${destination?.slug}`}>
                    <MapPin className="w-4 h-4 mr-2" />
                    View Destination
                  </Link>
                </Button>

                {canCancel && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this booking?')) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Cancel Booking
                  </Button>
                )}

                {booking.status === 'confirmed' && (
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-600">Trip Confirmed!</p>
                    <p className="text-sm text-green-600/80">
                      Get ready for your adventure
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          bookingId={bookingId}
          destinationId={destination?._id}
        />
      )}
    </div>
  );
}

