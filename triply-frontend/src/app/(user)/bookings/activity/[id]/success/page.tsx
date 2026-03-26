'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { paymentsApi } from '@/lib/api/payments';

export default function ActivityBookingSuccessPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const queryClient = useQueryClient();
  const confirmedRef = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Confirm payment from Stripe session when we have session_id (webhook fallback).
  useEffect(() => {
    if (!bookingId || confirmedRef.current) return;
    confirmedRef.current = true;
    if (!sessionId) {
      router.replace(`/bookings/${bookingId}`);
      return;
    }

    setIsConfirming(true);
    paymentsApi
      .confirmFromSession(sessionId)
      .then(() => {
        // Make sure the detail page and lists reflect the updated booking.status.
        queryClient.invalidateQueries({ queryKey: ['my-activity-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['activity-booking', bookingId] });
      })
      .finally(() => {
        router.replace(`/bookings/${bookingId}`);
        setIsConfirming(false);
      });
  }, [sessionId, bookingId, queryClient, router]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {isConfirming ? <p className="text-sm text-muted-foreground mt-3">Finalizing payment...</p> : null}
      </div>
    </div>
  );
}
