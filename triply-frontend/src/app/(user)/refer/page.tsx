'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Gift, Copy, Check, Users, DollarSign, 
  TrendingUp, Share2, Mail, MessageSquare, 
  Loader2, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  AffiliateTable,
  AffiliateTableBody,
  AffiliateTableCell,
  AffiliateTableHead,
  AffiliateTableRow,
  AffiliateTableScroll,
  AffiliateTableTh,
} from '@/components/affiliate/AffiliateDataTable';

export default function ReferPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading, refetch } = useQuery({
    queryKey: ['my-referral'],
    queryFn: () => affiliatesApi.getMyReferral(),
    enabled: isAuthenticated,
  });

  const { data: referralsData } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => affiliatesApi.getMyReferrals(1, 10),
    enabled: isAuthenticated,
  });

  const { data: commissionsData } = useQuery({
    queryKey: ['my-referral-commissions'],
    queryFn: () => affiliatesApi.getMyReferralCommissions(1, 10),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const referralCode = referralData?.code || '';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;
  const discountPercentage = referralData?.discountPercentage || 10;
  const stats = referralData?.stats || {
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'Join TRIPLY with my referral code!',
      text: `Use my referral code ${referralCode} and get ${discountPercentage}% off your first booking!`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: 'Shared!',
          description: 'Thanks for sharing!',
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy link
      copyToClipboard(referralLink);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Refer & Earn</h1>
          <p className="text-muted-foreground">
            Invite friends and earn money when they book their first trip!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Referrals</CardDescription>
              <CardTitle className="text-2xl">{stats.totalReferrals}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                People you've referred
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.totalEarnings)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 mr-1" />
                All time earnings
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.pendingEarnings)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1" />
                Awaiting payment
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.paidEarnings)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="w-4 h-4 mr-1" />
                Received payments
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <CardTitle>Your Referral Code</CardTitle>
            </div>
            <CardDescription>
              Share this code with friends and earn {discountPercentage}% commission when they book!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border-2 border-dashed">
                  <span className="text-2xl font-bold font-mono">{referralCode}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {discountPercentage}% OFF
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => copyToClipboard(referralCode)}
                variant="outline"
                size="lg"
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button
                onClick={shareReferral}
                size="lg"
                className="shrink-0"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Referral Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(referralLink)}
                  variant="outline"
                  size="sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">How it works:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>1. Share your referral code or link with friends</li>
                <li>2. They sign up using your code and get {discountPercentage}% off their first booking</li>
                <li>3. When they complete their first booking, you earn a commission!</li>
                <li>4. Earnings are paid out after their booking is confirmed</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referred Users */}
          <Card>
            <CardHeader>
              <CardTitle>People You&apos;ve Referred</CardTitle>
              <CardDescription>
                {referralsData?.data?.length || 0} of {stats.totalReferrals} total referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {referralsData?.data?.length ? (
                <AffiliateTableScroll>
                  <AffiliateTable>
                    <AffiliateTableHead>
                      <AffiliateTableTh>Name</AffiliateTableTh>
                      <AffiliateTableTh>Email</AffiliateTableTh>
                      <AffiliateTableTh>Code used</AffiliateTableTh>
                      <AffiliateTableTh>Status</AffiliateTableTh>
                      <AffiliateTableTh>Commission</AffiliateTableTh>
                      <AffiliateTableTh>Joined</AffiliateTableTh>
                    </AffiliateTableHead>
                    <AffiliateTableBody>
                      {referralsData.data.map((referral: any) => (
                        <AffiliateTableRow key={referral._id}>
                          <AffiliateTableCell className="font-medium">
                            {referral.firstName} {referral.lastName}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-sm text-muted-foreground">
                            {referral.email}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="font-mono text-sm">
                            {referral.referralCode || '—'}
                          </AffiliateTableCell>
                          <AffiliateTableCell>
                            {referral.hasBooking ? (
                              <Badge variant="default">Booked</Badge>
                            ) : (
                              <Badge variant="secondary">No booking yet</Badge>
                            )}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="font-semibold text-primary">
                            {referral.hasBooking ? formatCurrency(referral.totalEarnings) : '—'}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-sm text-muted-foreground">
                            {formatDate(referral.createdAt)}
                          </AffiliateTableCell>
                        </AffiliateTableRow>
                      ))}
                    </AffiliateTableBody>
                  </AffiliateTable>
                </AffiliateTableScroll>
              ) : (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm">Start sharing your code to earn!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission History */}
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Your earnings from referrals</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {commissionsData?.data?.length > 0 ? (
                <AffiliateTableScroll>
                  <AffiliateTable>
                    <AffiliateTableHead>
                      <AffiliateTableTh>Booking</AffiliateTableTh>
                      <AffiliateTableTh>Amount</AffiliateTableTh>
                      <AffiliateTableTh>Status</AffiliateTableTh>
                      <AffiliateTableTh>Date</AffiliateTableTh>
                    </AffiliateTableHead>
                    <AffiliateTableBody>
                      {commissionsData.data.map((commission: any) => (
                        <AffiliateTableRow key={commission._id}>
                          <AffiliateTableCell className="font-mono text-sm">
                            {commission.bookingId?.bookingReference || 'N/A'}
                          </AffiliateTableCell>
                          <AffiliateTableCell className="font-semibold text-primary">
                            {formatCurrency(commission.commissionAmount)}
                          </AffiliateTableCell>
                          <AffiliateTableCell>
                            <Badge
                              variant={
                                commission.status === 'paid'
                                  ? 'default'
                                  : commission.status === 'approved'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {commission.status}
                            </Badge>
                          </AffiliateTableCell>
                          <AffiliateTableCell className="text-sm text-muted-foreground">
                            {formatDate(commission.createdAt)}
                          </AffiliateTableCell>
                        </AffiliateTableRow>
                      ))}
                    </AffiliateTableBody>
                  </AffiliateTable>
                </AffiliateTableScroll>
              ) : (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No commissions yet</p>
                  <p className="text-sm">Earn when your referrals book!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

