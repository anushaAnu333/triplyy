'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, CreditCard, ArrowLeft, 
  Lock, Calendar, MapPin, Users, Shield, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { paymentsApi } from '@/lib/api/payments';
import { activitiesApi } from '@/lib/api/activities';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ActivityPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingId = params.bookingId as string;

  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: booking, isLoading: isLoadingBooking, error: bookingError } = useQuery({
    queryKey: ['activityBooking', bookingId],
    queryFn: () => activitiesApi.getBookingById(bookingId),
    enabled: !!bookingId,
  });

  const handleProceedToStripe = async () => {
    setIsRedirecting(true);
    try {
      const { url } = await paymentsApi.createActivityBookingCheckoutSession(bookingId);
      window.location.href = url;
    } catch (error: unknown) {
      setIsRedirecting(false);
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast({
        title: 'Cannot proceed to payment',
        description: msg || 'Payment is not available. Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  // Show loading state
  if (isLoadingBooking) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Activity booking not found</p>
            <Button onClick={() => router.push('/activities')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if payment is already completed
  if (booking.status === 'payment_completed' || booking.status === 'confirmed') {
    router.push(`/bookings/activity/${bookingId}/success`);
    return null;
  }

  const activity = booking.activityId as { title?: string } | undefined;
  const totalAmount = booking.payment.amount;
  const currency = booking.payment.currency || 'AED';

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/activities">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  You will be redirected to Stripe to complete your payment securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold mb-1">Secure Payment</p>
                    <p>Pay with card (Visa, Mastercard, etc.) on Stripe&apos;s secure checkout page.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={isRedirecting}
                  onClick={handleProceedToStripe}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Proceed to Pay {formatCurrency(totalAmount, currency)}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Booking Reference: {booking.bookingReference}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{activity?.title || 'Activity Booking'}</span>
                  </div>
                  {booking.selectedDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(booking.selectedDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {booking.numberOfParticipants && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{booking.numberOfParticipants} {booking.numberOfParticipants === 1 ? 'Participant' : 'Participants'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    By completing this payment, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
