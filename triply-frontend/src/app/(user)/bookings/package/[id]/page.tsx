'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { packageBookingsApi } from '@/lib/api/packageBookings';
import { formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import type { TripPackage } from '@/lib/api/packages';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getPackageEnquiryConfig, getWhatsAppEnquiryUrl } from '@/lib/packageEnquiry';

/**
 * Legacy package booking view (enquiry-led flow; online deposit no longer offered from marketing pages).
 */
export default function PackageBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = params.id as string;
  const enquiry = getPackageEnquiryConfig();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['package-booking', bookingId],
    queryFn: () => packageBookingsApi.getById(bookingId),
    enabled: isAuthenticated && !!bookingId,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const pkg = booking?.packageId as TripPackage | undefined;
  const waUrl = pkg
    ? getWhatsAppEnquiryUrl(`${pkg.name} — ref ${booking?.bookingReference ?? bookingId}`)
    : enquiry.whatsappHref;

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
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isPendingDeposit = booking.status === 'pending_deposit';
  const isPendingDate = booking.status === 'pending_date';
  const hasDates = Boolean(booking.travelDates?.startDate && booking.travelDates?.endDate);

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {pkg?.thumbnailImage ? (
                      <img src={pkg.thumbnailImage} alt={pkg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">Package</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="font-display text-2xl font-bold">{pkg?.name ?? 'Package'}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{pkg?.location}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Reference</p>
                        <p className="font-mono font-semibold">{booking.bookingReference}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booked</p>
                        <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Travellers</p>
                        <p className="font-semibold">{booking.numberOfTravellers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Travel dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasDates ? (
                  <p className="text-lg font-semibold">
                    {format(new Date(booking.travelDates.startDate!), 'PPP')} –{' '}
                    {format(new Date(booking.travelDates.endDate!), 'PPP')}
                  </p>
                ) : isPendingDate ? (
                  <p className="text-muted-foreground">
                    Your travel dates are not set yet. Our team will assign them and you will be notified by email.
                  </p>
                ) : isPendingDeposit ? (
                  <p className="text-muted-foreground">
                    This request is pending confirmation. Please contact us with your reference to complete arrangements.
                  </p>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPendingDeposit && (
                  <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                    <p className="font-medium mb-2">Contact us</p>
                    <p className="text-muted-foreground mb-3">
                      Share reference <span className="font-mono font-semibold">{booking.bookingReference}</span> by phone or
                      WhatsApp.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={enquiry.telHref}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={pkg?.slug ? `/packages/${pkg.slug}` : '/packages'}>
                    <MapPin className="w-4 h-4 mr-2" />
                    View package
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
