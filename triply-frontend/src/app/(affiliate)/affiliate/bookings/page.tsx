'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'dates_selected', label: 'Dates Selected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AffiliateBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-bookings', page, statusFilter],
    queryFn: () => affiliatesApi.getReferralBookings(
      page, 
      10, 
      statusFilter === 'all' ? undefined : statusFilter
    ),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'affiliate')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'affiliate') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Referral Bookings</h1>
            <p className="text-muted-foreground">View all bookings from your referrals</p>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No referral bookings yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your affiliate code to start earning commissions
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Reference</th>
                      <th className="text-left p-4 font-medium">Destination</th>
                      <th className="text-left p-4 font-medium">Code Used</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Commission</th>
                      <th className="text-left p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((booking: any) => (
                      <tr key={booking._id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-mono font-medium">
                          {booking.bookingReference}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{booking.destinationId?.name?.en || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          {booking.affiliateCode}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(booking.depositPayment?.amount)}
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          +{formatCurrency((booking.depositPayment?.amount || 0) * 0.1)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(booking.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data?.meta?.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {data.meta.totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

