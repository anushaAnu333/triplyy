'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, Users, Copy, 
  ArrowRight, Calendar, Check, Loader2, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency, formatDate } from '@/lib/utils';
import { WithdrawalModal } from '@/components/affiliate/WithdrawalModal';

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

  // Get approved commissions to calculate available balance
  const { data: approvedCommissions } = useQuery({
    queryKey: ['affiliate-commissions-approved'],
    queryFn: () => affiliatesApi.getCommissions(1, 100, 'approved'),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

  // Calculate available balance (only approved commissions)
  // Use approvedEarnings from dashboard stats if available, otherwise calculate from commissions
  const availableBalance = dashboard?.stats?.approvedEarnings || 
    (approvedCommissions?.data?.reduce(
      (sum: number, commission: any) => sum + commission.commissionAmount,
      0
    ) || 0);

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
      // Refresh the dashboard data
      queryClient.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
    } catch (error: any) {
      toast({
        title: 'Failed to Generate Code',
        description: error.response?.data?.message || 'Unable to generate new code',
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your referrals and earnings</p>
        </div>

        {/* Stats Cards */}
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
                  <p className="text-3xl font-bold">
                    {formatCurrency(availableBalance)}
                  </p>
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
                  <p className="text-3xl font-bold">{dashboard?.stats.totalBookings || 0}</p>
                </div>
                <Users className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Affiliate Codes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Affiliate Codes</CardTitle>
                <CardDescription>Share these codes with your referrals</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerateCode}
                disabled={isGenerating}
              >
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
                <p className="text-center text-muted-foreground py-8">
                  No affiliate codes yet
                </p>
              ) : (
                <div className="space-y-4">
                  {dashboard?.codes?.map((code) => (
                    <div 
                      key={code.code}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="font-mono font-bold text-primary">
                            {code.commissionRate}%
                          </span>
                        </div>
                        <div>
                          <p className="font-mono font-bold text-lg">{code.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {code.usageCount} uses • {formatCurrency(code.totalEarnings)} earned
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyCode(code.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Section */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Withdraw Earnings
              </CardTitle>
              <CardDescription>
                Request withdrawal of your approved commissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(availableBalance)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only approved commissions can be withdrawn
                </p>
              </div>
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                className="w-full"
                disabled={availableBalance === 0}
                size="lg"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Request Withdrawal
              </Button>
              {availableBalance === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  No approved commissions available for withdrawal
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/affiliate/bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Referral Bookings
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/affiliate/commissions">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Commission History
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>Latest bookings using your codes</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/affiliate/bookings">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : dashboard?.recentBookings?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No referral bookings yet. Share your code to start earning!
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard?.recentBookings?.map((booking: any) => (
                  <div 
                    key={booking._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-mono font-medium">{booking.bookingReference}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(booking.depositPayment?.amount)}
                      </p>
                      <p className="text-sm text-green-600">
                        +{formatCurrency(booking.depositPayment?.amount * 0.1)} commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Modal */}
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          availableBalance={availableBalance}
        />
      </div>
    </div>
  );
}

