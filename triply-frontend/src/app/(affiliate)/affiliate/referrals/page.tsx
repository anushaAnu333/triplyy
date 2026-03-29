'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AffiliateTable,
  AffiliateTableBody,
  AffiliateTableCell,
  AffiliateTableHead,
  AffiliateTableRow,
  AffiliateTableScroll,
  AffiliateTableTh,
} from '@/components/affiliate/AffiliateDataTable';

export default function AffiliateReferralsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-referred-signups', page],
    queryFn: () => affiliatesApi.getMyReferrals(page, 10),
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
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Referral sign-ups</h1>
          <p className="text-muted-foreground">
            People who registered using your referral code
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Who used your code</CardTitle>
            <CardDescription>
              {data?.meta?.total ?? 0} total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : !data?.data?.length ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sign-ups yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your affiliate code from the dashboard
                </p>
              </div>
            ) : (
              <AffiliateTableScroll>
                <AffiliateTable>
                  <AffiliateTableHead>
                    <AffiliateTableTh>Name</AffiliateTableTh>
                    <AffiliateTableTh>Email</AffiliateTableTh>
                    <AffiliateTableTh>Code used</AffiliateTableTh>
                    <AffiliateTableTh>Status</AffiliateTableTh>
                    <AffiliateTableTh>Commission</AffiliateTableTh>
                    <AffiliateTableTh>Signed up</AffiliateTableTh>
                  </AffiliateTableHead>
                  <AffiliateTableBody>
                    {data.data.map((row) => (
                      <AffiliateTableRow key={row._id}>
                        <AffiliateTableCell className="font-medium">
                          {row.firstName} {row.lastName}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm text-muted-foreground">
                          {row.email}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="font-mono text-sm">
                          {row.referralCode || '—'}
                        </AffiliateTableCell>
                        <AffiliateTableCell>
                          {row.hasBooking ? (
                            <Badge>Booked</Badge>
                          ) : (
                            <Badge variant="secondary">No booking yet</Badge>
                          )}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="font-semibold text-green-600">
                          {row.hasBooking ? formatCurrency(row.totalEarnings) : '—'}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm text-muted-foreground">
                          {formatDate(row.createdAt)}
                        </AffiliateTableCell>
                      </AffiliateTableRow>
                    ))}
                  </AffiliateTableBody>
                </AffiliateTable>
              </AffiliateTableScroll>
            )}
          </CardContent>
        </Card>

        {data && data.meta.totalPages > 1 && (
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
