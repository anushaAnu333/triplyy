'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, Users, Copy, 
  ArrowRight, Calendar, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

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
                  <p className="text-white/80 text-sm">Pending Earnings</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(dashboard?.stats.pendingEarnings || 0)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-white/30" />
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
              <Button variant="outline" size="sm">
                Generate New Code
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

          {/* Quick Links */}
          <Card>
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
      </div>
    </div>
  );
}

