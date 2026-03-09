'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, CreditCard, ArrowLeft, 
  Lock, Calendar, MapPin, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { formatCurrency } from '@/lib/utils';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingId = params.bookingId as string;

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [activityAmount, setActivityAmount] = useState<number>(0);
  const [hasActivities, setHasActivities] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('AED');

  // Fetch booking details
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking) {
      if (booking.status === 'deposit_paid' || booking.depositPayment?.paymentStatus === 'completed') {
        router.push(`/payment/${bookingId}/success`);
        return;
      }
      const storedPaymentData = localStorage.getItem(`payment_${bookingId}`);
      if (storedPaymentData) {
        try {
          const data = JSON.parse(storedPaymentData);
          setDepositAmount(data.depositAmount ?? booking.depositPayment?.amount ?? 0);
          setTotalAmount(data.totalAmount ?? data.depositAmount ?? booking.depositPayment?.amount ?? 0);
          setActivityAmount(data.activityAmount ?? 0);
          setHasActivities(data.hasActivities ?? false);
          setCurrency(data.currency ?? booking.depositPayment?.currency ?? 'AED');
        } catch {
          const deposit = booking.depositPayment?.amount ?? 0;
          setDepositAmount(deposit);
          setTotalAmount(deposit);
          setCurrency(booking.depositPayment?.currency ?? 'AED');
        }
      } else {
        const deposit = booking.depositPayment?.amount ?? 0;
        setDepositAmount(deposit);
        setTotalAmount(deposit);
        setActivityAmount(0);
        setHasActivities(!!(booking.linkedActivityBookings?.length));
        setCurrency(booking.depositPayment?.currency ?? 'AED');
      }
    }
  }, [booking, bookingId, router]);

  const handleProceedToStripe = async () => {
    setIsRedirecting(true);
    try {
      const { url } = await paymentsApi.createCheckoutSession(bookingId);
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

  if (isLoadingBooking) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Booking not found</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const displayAmount = totalAmount || depositAmount;
  const destinationName = typeof booking.destinationId === 'object'
    ? booking.destinationId?.name || 'N/A'
    : 'N/A';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Payment – main focus */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg mb-0">Complete your deposit</CardTitle>
                    <CardDescription className="mt-0.5">
                      Secure payment via Stripe
                    </CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You&apos;ll be taken to Stripe&apos;s checkout to pay with your card (Visa, Mastercard, etc.). Your details are never stored on our servers.
                </p>

                <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Encrypted and secure. Powered by Stripe.</span>
                </div>

                <Button
                  type="button"
                  className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                  disabled={isRedirecting}
                  onClick={handleProceedToStripe}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay {formatCurrency(displayAmount, currency)}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-2">
            <Card className="border shadow-md sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Booking summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Destination
                  </div>
                  <p className="text-sm font-medium leading-snug">
                    {destinationName}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Travellers
                  </div>
                  <p className="text-sm font-medium">
                    {booking.numberOfTravellers} {booking.numberOfTravellers === 1 ? 'person' : 'people'}
                  </p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Destination deposit</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(depositAmount, currency)}
                    </span>
                  </div>
                  {hasActivities && activityAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Activities</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(activityAmount, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(displayAmount, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

