'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  MessageSquare,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { activitiesApi, type Activity, type ActivityBooking } from '@/lib/api/activities';
import { paymentsApi } from '@/lib/api/payments';
import { formatCurrency, formatDate, formatActivityBookingDates } from '@/lib/utils';

function getActivityBookingStatusColor(status: ActivityBooking['status']): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_completed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getActivityBookingStatusLabel(status: ActivityBooking['status']): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    payment_completed: 'Payment Completed',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

function getPaymentStatusLabel(status: ActivityBooking['payment']['paymentStatus']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    case 'pending':
    default:
      return 'Pending';
  }
}

export default function ActivityBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const bookingId = params.id as string;
  const queryClient = useQueryClient();

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const {
    data: booking,
    isLoading: bookingLoading,
    isError: bookingError,
  } = useQuery({
    queryKey: ['activity-booking', bookingId],
    queryFn: () => activitiesApi.getBookingById(bookingId),
    enabled: !!bookingId && isAuthenticated,
  });

  const activityId = (booking?.activityId as any)?._id || (booking?.activityId as any);

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
  } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => activitiesApi.getById(activityId as string),
    enabled: !!activityId && !!booking && isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const activityApproved = activity?.status === 'approved';
  const merchantSlotApproved = booking?.merchantAvailabilityApproved === true;
  const showPayNow =
    booking?.status === 'pending_payment' && activityApproved && merchantSlotApproved;
  const canPayNow = showPayNow && !isPaymentLoading;

  const cancelMutation = useMutation({
    mutationFn: () => activitiesApi.cancelActivityBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activity-booking', bookingId] });
      await queryClient.invalidateQueries({ queryKey: ['my-activity-bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your activity booking was cancelled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel booking',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handlePayNow = async () => {
    if (!bookingId || !canPayNow) return;
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

  const headerImage = useMemo(() => {
    const photos = (activity as Activity | undefined)?.photos || [];
    return photos[0] || '/placeholder-activity.jpg';
  }, [activity]);

  if (authLoading || bookingLoading || activityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4">
        <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
        <Button asChild>
          <Link href="/bookings/activity">View Activity Bookings</Link>
        </Button>
      </div>
    );
  }

  if (activityError || !activity) {
    // Still render booking details; image/title can be fallback.
  }

  const bookedOn = formatDate(booking.createdAt);

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/bookings/activity">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activity Bookings
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
                    <img src={headerImage} alt={activity?.title || 'Activity'} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold">
                          {activity?.title || (booking.activityId as any)?.title || 'Activity'}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{activity?.location || (booking.activityId as any)?.location || ''}</span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityBookingStatusColor(
                          booking.status
                        )}`}
                      >
                        {getActivityBookingStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Booking Reference</p>
                        <p className="font-mono font-semibold">{booking.bookingReference}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Participants</p>
                        <p className="font-semibold">{booking.numberOfParticipants}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold">{activity?.duration || 'Flexible time'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booked On</p>
                        <p className="font-semibold">{bookedOn}</p>
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
                      {booking.selectedDate ? formatActivityBookingDates(booking) : 'N/A'}
                    </p>
                    {activity?.duration ? (
                      <p className="text-sm text-muted-foreground mt-1">{activity.duration}</p>
                    ) : null}
                  </div>
                  {booking.status === 'pending_payment' ? (
                    <div className="text-right">
                      {!activityApproved ? (
                        <>
                          <p className="text-amber-600 font-medium">Waiting for platform approval</p>
                          <p className="text-sm text-muted-foreground">We will email you when your booking can proceed.</p>
                        </>
                      ) : !merchantSlotApproved ? (
                        <>
                          <p className="text-amber-600 font-medium">Waiting for merchant confirmation</p>
                          <p className="text-sm text-muted-foreground">The host must confirm availability for your date before you can pay.</p>
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
                  <span>Payment Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.payment.amount, booking.payment.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span>Payment Status</span>
                  <span
                    className={`font-semibold ${
                      booking.payment.paymentStatus === 'completed'
                        ? 'text-green-600'
                        : booking.payment.paymentStatus === 'failed'
                          ? 'text-red-600'
                          : booking.payment.paymentStatus === 'refunded'
                            ? 'text-red-600'
                            : 'text-amber-600'
                    }`}
                  >
                    {getPaymentStatusLabel(booking.payment.paymentStatus)}
                  </span>
                </div>

              </CardContent>
            </Card>

            {/* Special Requests */}
            {booking.specialRequests ? (
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
            ) : null}

            {/* Confirmed */}
            {booking.status === 'confirmed' ? (
              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-6 text-center">
                  <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-600">Activity Confirmed!</p>
                  <p className="text-sm text-green-600/80">
                    Get ready for your adventure
                  </p>
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
                {showPayNow ? (
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
                    Pay now
                  </Button>
                ) : null}

                {booking.status === 'pending_payment' && !showPayNow ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                    {!activityApproved
                      ? 'Payment unlocks after the activity is approved on the platform.'
                      : 'Payment unlocks after the merchant confirms availability for your date.'}
                  </div>
                ) : null}

                {booking.status === 'pending_payment' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this activity booking?')) {
                        cancelMutation.mutate();
                      }
                    }}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Cancel Booking
                  </Button>
                )}

                {activity?._id ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/activities/${activity._id}`}>
                      <MapPin className="w-4 h-4 mr-2" />
                      View Activity
                    </Link>
                  </Button>
                ) : null}

                {booking.status === 'cancelled' ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <X className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">Cancelled</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

