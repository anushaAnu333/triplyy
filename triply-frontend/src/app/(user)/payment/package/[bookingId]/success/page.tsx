'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { packageBookingsApi } from '@/lib/api/packageBookings';
import { paymentsApi } from '@/lib/api/payments';
import { formatCurrency } from '@/lib/utils';
import type { TripPackage } from '@/lib/api/packages';

export default function PackagePaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const bookingId = params.bookingId as string;
  const sessionId = searchParams.get('session_id');
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !bookingId || confirmedRef.current) return;
    confirmedRef.current = true;
    paymentsApi
      .confirmFromSession(sessionId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['package-booking', bookingId] });
        queryClient.invalidateQueries({ queryKey: ['package-bookings', 'mine'] });
      })
      .catch(() => {
        confirmedRef.current = false;
      });
  }, [sessionId, bookingId, queryClient]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['package-booking', bookingId],
    queryFn: () => packageBookingsApi.getById(bookingId),
    enabled: !!bookingId,
  });

  const pkg = booking?.packageId as TripPackage | undefined;

  if (isLoading) {
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Payment successful</h1>
        <p className="text-xl text-muted-foreground">Your package deposit has been received</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Package</p>
              <p className="font-semibold">{pkg?.name ?? 'Package'}</p>
              {pkg?.location && <p className="text-sm text-muted-foreground">{pkg.location}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Travellers</p>
              <p className="font-semibold">{booking.numberOfTravellers}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deposit paid</p>
            <p className="font-semibold">
              {formatCurrency(booking.depositPayment?.amount ?? 0, booking.depositPayment?.currency || 'AED')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-amber-50 border-amber-200">
        <CardContent className="pt-6 text-sm text-amber-950">
          <p className="font-medium mb-1">What happens next</p>
          <p className="text-amber-900/90">
            You do not need to pick travel dates now. Our team will assign your travel dates and update this booking. You will be
            notified by email.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => router.push(`/bookings/package/${bookingId}`)} className="flex-1" size="lg">
          View booking
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1" size="lg">
          Dashboard
        </Button>
      </div>
    </div>
  );
}
