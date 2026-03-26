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
import { activitiesApi, type Activity, type ActivityBooking as ActivityBookingType } from '@/lib/api/activities';
import { paymentsApi } from '@/lib/api/payments';
import {
  formatDate,
  formatCurrency,
  formatActivityBookingDates,
  getBookingStatusColor,
  getBookingStatusLabel,
} from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DatePickerModal } from '@/components/booking/DatePickerModal';
import { ActivityBooking as LinkedActivityBooking } from '@/lib/api/bookings';

function getActivityBookingStatusColor(status: ActivityBookingType['status']): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_completed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getActivityBookingStatusLabel(status: ActivityBookingType['status']): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    payment_completed: 'Payment Completed',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const {
    data: booking,
    isLoading,
    isError: isDestinationBookingError,
  } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: isAuthenticated && !!bookingId,
    retry: false,
  });

  const {
    data: activityBooking,
    isLoading: isActivityBookingLoading,
  } = useQuery({
    queryKey: ['activity-booking', bookingId],
    queryFn: () => activitiesApi.getBookingById(bookingId),
    enabled: isAuthenticated && !!bookingId && isDestinationBookingError,
    retry: false,
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

  const cancelActivityBookingMutation = useMutation({
    mutationFn: () => activitiesApi.cancelActivityBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-activity-bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your activity booking was cancelled successfully.',
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || isLoading || isActivityBookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking && !activityBooking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
        <Button asChild>
          <Link href="/bookings">View All Bookings</Link>
        </Button>
      </div>
    );
  }

  // Activity booking route uses the same page file.
  if (!booking && activityBooking) {
    const activity = activityBooking.activityId as unknown as Activity;
    const activityListingApproved = activity?.status === 'approved';
    const merchantSlotApproved = activityBooking.merchantAvailabilityApproved === true;

    const handlePayNowActivity = async () => {
      if (!bookingId || isPaymentLoading) return;
      if (!activityListingApproved || !merchantSlotApproved) return;
      setIsPaymentLoading(true);
      try {
        const { url } = await paymentsApi.createActivityBookingCheckoutSession(bookingId);
        if (url) window.location.href = url;
        else throw new Error('Missing Stripe URL');
      } catch {
        toast({
          title: 'Payment failed',
          description: 'Could not start payment. Please try again.',
          variant: 'destructive',
        });
        setIsPaymentLoading(false);
      }
    };

    const canPayNow =
      activityBooking.status === 'pending_payment' &&
      activityListingApproved &&
      merchantSlotApproved;

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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activity.photos?.[0] || '/placeholder-activity.jpg'}
                        alt={activity.title || 'Activity'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h1 className="font-display text-2xl md:text-3xl font-bold">
                            {activity.title || 'Activity'}
                          </h1>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.location || ''}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityBookingStatusColor(
                            activityBooking.status
                          )}`}
                        >
                          {getActivityBookingStatusLabel(activityBooking.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Booking Reference</p>
                          <p className="font-mono font-semibold">{activityBooking.bookingReference}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Travellers</p>
                          <p className="font-semibold">{activityBooking.numberOfParticipants}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">{activity.duration || 'Flexible time'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Booked On</p>
                          <p className="font-semibold">{formatDate(activityBooking.createdAt)}</p>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {activityBooking.selectedDate
                          ? formatActivityBookingDates(activityBooking)
                          : 'N/A'}
                      </p>
                      {activityBooking.selectedDate ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          {(activityBooking.selectedDates?.length ?? 0) > 1
                            ? 'Selected dates for your booking'
                            : 'Selected for your booking'}
                        </p>
                      ) : null}
                    </div>
                    {activityBooking.status === 'pending_payment' ? (
                      <div className="text-right">
                        {!activityListingApproved ? (
                          <>
                            <p className="text-amber-600 font-medium">Waiting for platform approval</p>
                            <p className="text-sm text-muted-foreground">We will email you when your booking can proceed.</p>
                          </>
                        ) : !merchantSlotApproved ? (
                          <>
                            <p className="text-amber-600 font-medium">Waiting for merchant confirmation</p>
                            <p className="text-sm text-muted-foreground">
                              The host must confirm availability for your selected date(s) before you can pay.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-amber-600 font-medium">Payment pending</p>
                            <p className="text-sm text-muted-foreground">Complete payment to secure your seat</p>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
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
                    <span>Payment amount</span>
                    <span className="font-semibold">
                      {formatCurrency(activityBooking.payment.amount, activityBooking.payment.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span>Payment Status</span>
                    <span
                      className={`font-semibold ${
                        activityBooking.payment.paymentStatus === 'completed'
                          ? 'text-green-600'
                          : activityBooking.payment.paymentStatus === 'failed'
                            ? 'text-red-600'
                            : activityBooking.payment.paymentStatus === 'refunded'
                              ? 'text-red-600'
                              : 'text-amber-600'
                      }`}
                    >
                      {activityBooking.payment.paymentStatus.charAt(0).toUpperCase() +
                        activityBooking.payment.paymentStatus.slice(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              {activityBooking.specialRequests ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Special Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{activityBooking.specialRequests}</p>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Sidebar Actions */}
            <div className="lg:w-80">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canPayNow ? (
                    <Button
                      className="w-full"
                      onClick={handlePayNowActivity}
                      disabled={isPaymentLoading}
                    >
                      {isPaymentLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Pay now
                    </Button>
                  ) : null}

                  {activityBooking.status === 'pending_payment' && !canPayNow ? (
                    <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                      {!activityListingApproved
                        ? 'Payment unlocks after the activity is approved on the platform.'
                        : 'Payment unlocks after the merchant confirms availability for your date.'}
                    </div>
                  ) : null}

                  {activityBooking.status === 'pending_payment' && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={cancelActivityBookingMutation.isPending}
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this activity booking?')) {
                          cancelActivityBookingMutation.mutate();
                        }
                      }}
                    >
                      {cancelActivityBookingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Cancel booking
                    </Button>
                  )}

                  {activity?._id ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/activities/${activity._id}`}>
                        <MapPin className="w-4 h-4 mr-2" />
                        View activity
                      </Link>
                    </Button>
                  ) : null}

                  {activityBooking.status === 'confirmed' && (
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
      </div>
    );
  }

  // From here on we render the destination booking UI.
  if (!booking) return null;

  const destination = booking.destinationId as Destination;
  const canSelectDates = booking.status === 'deposit_paid';
  const canCancel = ['pending_deposit', 'deposit_paid', 'dates_selected'].includes(booking.status);
  const isPendingDeposit = booking.status === 'pending_deposit';

  const handlePayNow = async () => {
    if (!bookingId || isPaymentLoading) return;
    setIsPaymentLoading(true);
    try {
      const { url } = await paymentsApi.createCheckoutSession(bookingId);
      if (url) window.location.href = url;
    } catch {
      toast({
        title: 'Payment failed',
        description: 'Could not start payment. Please try again.',
        variant: 'destructive',
      });
      setIsPaymentLoading(false);
    }
  };

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
                        alt={destination.name}
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
                          {destination?.name || 'Destination'}
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
                    {booking.linkedActivityBookings.map((activityBooking: LinkedActivityBooking) => {
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
                {isPendingDeposit && (
                  <Button
                    className="w-full"
                    onClick={handlePayNow}
                    disabled={isPaymentLoading}
                  >
                    {isPaymentLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Pay Now
                  </Button>
                )}
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

