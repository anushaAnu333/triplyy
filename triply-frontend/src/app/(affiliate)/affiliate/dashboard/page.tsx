'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Users,
  Copy,
  ArrowRight,
  Check,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
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

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

  /** Dashboard aggregates approved commission totals — no second request */
  const availableBalance = dashboard?.stats?.approvedEarnings ?? 0;

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'affiliate') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code Copied!',
      description: `${code} has been copied to clipboard`,
    });
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const result = await affiliatesApi.generateCode();
      toast({
        title: 'Code Generated!',
        description: `New affiliate code: ${result.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
          ? String((error.response.data as { message?: string }).message)
          : 'Unable to generate new code';
      toast({
        title: 'Failed to Generate Code',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your referrals and earnings</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(dashboard?.stats.totalEarnings || 0)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Available for Withdrawal</p>
                  <p className="text-3xl font-bold">{formatCurrency(availableBalance)}</p>
                  <p className="text-white/60 text-xs mt-1">Approved commissions</p>
                </div>
                <Wallet className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Paid Out</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(dashboard?.stats.paidEarnings || 0)}
                  </p>
                </div>
                <Check className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Referrals</p>
                  <p className="text-3xl font-bold">
                    {dashboard?.stats.totalReferredUsers ?? dashboard?.stats.totalBookings ?? 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Affiliate Codes</CardTitle>
              <CardDescription>Share these codes with your referrals</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateCode} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate New Code'
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {dashboard?.codes?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No affiliate codes yet</p>
            ) : (
              <div className="space-y-4">
                {dashboard?.codes?.map((code) => (
                  <div
                    key={code.code}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="font-mono font-bold text-primary">{code.commissionRate}%</span>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-lg">{code.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {code.signupCount ?? 0} sign-ups
                          {code.usageCount > 0 ? ` • ${code.usageCount} booking link uses` : ''} •{' '}
                          {formatCurrency(code.totalEarnings)} earned
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent referral trips</CardTitle>
              <CardDescription>
                Latest package bookings from people who signed up with your code. Commission amounts come
                from your stored commission records (percentage of the booking deposit total).
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/affiliate/bookings">
                View all referral trips
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : dashboard?.recentBookings?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 px-4">
                No trips yet from your referrals. When they book, you&apos;ll see rows here with commission
                from paid deposits.
              </p>
            ) : (
              <AffiliateTableScroll>
                <AffiliateTable>
                  <AffiliateTableHead>
                    <AffiliateTableTh>Reference</AffiliateTableTh>
                    <AffiliateTableTh>Deposit paid</AffiliateTableTh>
                    <AffiliateTableTh>Your commission</AffiliateTableTh>
                    <AffiliateTableTh>Payout</AffiliateTableTh>
                    <AffiliateTableTh>Date</AffiliateTableTh>
                  </AffiliateTableHead>
                  <AffiliateTableBody>
                    {dashboard?.recentBookings?.map((booking: {
                      _id: string;
                      bookingReference: string;
                      depositPayment?: { amount?: number };
                      createdAt: string;
                      referralCommission?: { commissionAmount: number; status: string };
                    }) => {
                      const rc = booking.referralCommission;
                      return (
                        <AffiliateTableRow key={booking._id}>
                          <AffiliateTableCell className="font-mono font-medium">
                            {booking.bookingReference}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="font-medium">
                            {formatCurrency(booking.depositPayment?.amount ?? 0)}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-sm font-semibold text-green-600">
                            {rc ? formatCurrency(rc.commissionAmount) : '—'}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-xs capitalize text-muted-foreground">
                            {rc?.status ?? '—'}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-sm text-muted-foreground">
                            {formatDate(booking.createdAt)}
                          </AffiliateTableCell>
                        </AffiliateTableRow>
                      );
                    })}
                  </AffiliateTableBody>
                </AffiliateTable>
              </AffiliateTableScroll>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
