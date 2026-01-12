'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Calendar, MapPin, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bookingsApi } from '@/lib/api/bookings';
import { formatCurrency } from '@/lib/utils';

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: !!bookingId,
  });

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
        
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your booking has been confirmed
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-semibold">
                  {typeof booking.destinationId === 'object' 
                    ? booking.destinationId.name?.en || 'N/A'
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Number of Travellers</p>
                <p className="font-semibold">
                  {booking.numberOfTravellers} {booking.numberOfTravellers === 1 ? 'Person' : 'People'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Deposit Paid</p>
                <p className="font-semibold">
                  {formatCurrency(
                    booking.depositPayment?.amount || 0,
                    booking.depositPayment?.currency || 'AED'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Your deposit has been processed successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Your calendar is now unlocked for 1 year</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>You can select your travel dates anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => router.push(`/bookings/${bookingId}`)}
          className="flex-1"
          size="lg"
        >
          View Booking Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

