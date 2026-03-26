'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  Users,
  CheckCircle2,
  Mail,
  Phone,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { merchantActivitiesApi, type MerchantBookingDetail } from '@/lib/api/activities';
import { formatCurrency, formatDate, formatActivityBookingDates, MERCHANT_PAGE_WIDTH_CLASS } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function getActivityBookingStatusColor(status: MerchantBookingDetail['status']): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_completed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getActivityBookingStatusLabel(status: MerchantBookingDetail['status']): string {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    payment_completed: 'Payment Completed',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

export default function MerchantBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['merchant-booking', bookingId],
    queryFn: () => merchantActivitiesApi.getMerchantBookingById(bookingId),
    enabled: isAuthenticated && user?.role === 'merchant' && !!bookingId,
    retry: false,
  });

  const approveAvailabilityMutation = useMutation({
    mutationFn: () => merchantActivitiesApi.approveMerchantAvailability(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-bookings'] });
      toast({
        title: 'Availability confirmed',
        description: 'The customer can now pay from their booking page.',
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Could not confirm availability',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const approveBookingMutation = useMutation({
    mutationFn: () => merchantActivitiesApi.approveActivityBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-bookings'] });
      toast({ title: 'Booking confirmed', description: 'This booking is now confirmed.' });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Failed to confirm booking',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user?.role !== 'merchant') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
        <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
        <Button asChild variant="outline">
          <Link href="/merchant/bookings">Back to bookings</Link>
        </Button>
      </div>
    );
  }

  const activity = booking.activity;
  const showConfirmAvailability =
    booking.status === 'pending_payment' &&
    activity.status === 'approved' &&
    !booking.merchantAvailabilityApproved;
  const showConfirmBooking = booking.status === 'payment_completed';

  const paymentStatusLabel =
    booking.payment.paymentStatus.charAt(0).toUpperCase() + booking.payment.paymentStatus.slice(1);

  const payoutStatusClass =
    booking.payment.merchantPayoutStatus === 'paid'
      ? 'text-green-600'
      : booking.payment.merchantPayoutStatus === 'failed'
        ? 'text-red-600'
        : 'text-amber-600';

  return (
    <div className="min-h-screen bg-muted/30 py-6 pb-10">
      <div className={MERCHANT_PAGE_WIDTH_CLASS}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="w-fit -ml-2">
            <Link href="/merchant/bookings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to bookings
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{booking.bookingReference}</span>
            <span className="hidden sm:inline">·</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getActivityBookingStatusColor(
                booking.status
              )}`}
            >
              {getActivityBookingStatusLabel(booking.status)}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">
          <div className="flex-1 min-w-0 space-y-6">
            {/* Booking header — matches user activity booking detail */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {activity.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activity.photos[0]}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="font-display text-2xl md:text-3xl font-bold">{activity.title}</h1>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{activity.location || ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Booking Reference</p>
                        <p className="font-mono font-semibold">{booking.bookingReference}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Travellers</p>
                        <p className="font-semibold">{booking.numberOfParticipants}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booked On</p>
                        <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <p
                          className={`font-semibold ${
                            booking.payment.paymentStatus === 'completed' ? 'text-green-600' : 'text-amber-600'
                          }`}
                        >
                          {booking.payment.paymentStatus === 'completed' ? 'Paid' : 'Unpaid'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Travel Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold">
                      {booking.selectedDate
                        ? formatActivityBookingDates({
                            selectedDate: booking.selectedDate,
                            selectedDates: booking.selectedDates,
                            lastActivityDate: booking.lastActivityDate,
                          })
                        : 'N/A'}
                    </p>
                    {booking.selectedDate ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        {(booking.selectedDates?.length ?? 0) > 1
                          ? 'Guest selected these dates for this booking'
                          : 'Guest selected this date'}
                      </p>
                    ) : null}
                    {booking.availabilities && booking.availabilities.length > 1 ? (
                      <ul className="mt-3 text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                        {booking.availabilities.map((a) => (
                          <li key={a._id}>{formatDate(a.date)}</li>
                        ))}
                      </ul>
                    ) : booking.availability?.date ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        Slot: {formatDate(booking.availability.date)}
                      </p>
                    ) : null}
                  </div>

                  {showConfirmAvailability ? (
                    <div className="text-right sm:max-w-[240px]">
                      <p className="text-amber-600 font-medium">Action needed</p>
                      <p className="text-sm text-muted-foreground">
                        Confirm availability so the guest can pay and secure this booking.
                      </p>
                    </div>
                  ) : booking.status === 'pending_payment' && activity.status && activity.status !== 'approved' ? (
                    <div className="text-right sm:max-w-[240px]">
                      <p className="text-amber-600 font-medium">Listing pending</p>
                      <p className="text-sm text-muted-foreground">
                        Platform must approve your activity before you can confirm slots.
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-base">{booking.customer.name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  {booking.customer.email}
                </p>
                {booking.customer.phone ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    {booking.customer.phone}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {booking.specialRequests ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Special Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{booking.specialRequests}</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Payment — row layout like user booking detail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-3 border-b">
                  <span>Total (guest pays)</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.payment.amount, booking.payment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span>Payment status</span>
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
                    {paymentStatusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Your share (80%)</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.payment.merchantAmount, booking.payment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Triply commission (20%)</span>
                  <span>{formatCurrency(booking.payment.triplyCommission, booking.payment.currency)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Payout status</span>
                  <span className={`font-semibold capitalize ${payoutStatusClass}`}>
                    {booking.payment.merchantPayoutStatus}
                  </span>
                </div>
                {booking.payment.paidAt ? (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Paid at</span>
                    <span className="font-medium">{formatDate(booking.payment.paidAt)}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-full shrink-0 lg:w-96">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity._id ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/merchant/activities/${activity._id}`}>
                      <MapPin className="w-4 h-4 mr-2" />
                      View activity
                    </Link>
                  </Button>
                ) : null}

                {showConfirmAvailability ? (
                  <Button
                    className="w-full"
                    disabled={approveAvailabilityMutation.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          'Confirm that these dates and number of guests are available? The customer will be able to pay after this.'
                        )
                      ) {
                        approveAvailabilityMutation.mutate();
                      }
                    }}
                  >
                    {approveAvailabilityMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="w-4 h-4 mr-2" />
                    )}
                    Confirm availability
                  </Button>
                ) : null}

                {booking.status === 'pending_payment' && activity.status && activity.status !== 'approved' ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                    Your activity listing is still pending platform approval. You cannot confirm availability yet.
                  </div>
                ) : null}

                {showConfirmBooking ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={approveBookingMutation.isPending}
                    onClick={() => {
                      if (confirm('Mark this booking as fully confirmed?')) {
                        approveBookingMutation.mutate();
                      }
                    }}
                  >
                    {approveBookingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Confirm booking
                  </Button>
                ) : null}

                {booking.status === 'confirmed' ? (
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-600">Booking confirmed</p>
                    <p className="text-sm text-green-600/80">This reservation is confirmed with the guest.</p>
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
