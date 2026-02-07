'use client';

import { useParams, useRouter } from 'next/navigation';
import { Check, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ActivityBookingSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Your activity booking has been confirmed successfully. You will receive a confirmation email shortly.
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Booking Reference</span>
                <span className="font-mono font-semibold">{bookingId?.slice(-8) || 'N/A'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/bookings">View My Bookings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/activities">Browse More Activities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
