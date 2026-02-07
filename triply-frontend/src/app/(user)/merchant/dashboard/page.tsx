'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, CheckCircle2, XCircle, Clock, DollarSign, Wallet, TrendingUp, Calendar, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { merchantActivitiesApi, Activity } from '@/lib/api/activities';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['merchant-activities'],
    queryFn: () => merchantActivitiesApi.getMyActivities(),
    enabled: isAuthenticated && user?.role === 'merchant',
  });

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => merchantActivitiesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'merchant',
  });

  // Check if user is merchant
  if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
    router.push('/dashboard');
    return null;
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const pendingCount = activities?.filter((a) => a.status === 'pending').length || 0;
  const approvedCount = activities?.filter((a) => a.status === 'approved').length || 0;
  const rejectedCount = activities?.filter((a) => a.status === 'rejected').length || 0;

  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Merchant Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your activities and track their status
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/merchant/availability">
                <CalendarDays className="mr-2 h-4 w-4" />
                Manage Availability
              </Link>
            </Button>
            <Button asChild>
              <Link href="/merchant/add-activity">
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Earnings Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold">
                    {isLoadingDashboard ? '...' : formatCurrency(dashboard?.stats.totalEarnings || 0, 'AED')}
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
                  <p className="text-white/80 text-sm">Pending Payouts</p>
                  <p className="text-3xl font-bold">
                    {isLoadingDashboard ? '...' : formatCurrency(dashboard?.stats.pendingPayouts || 0, 'AED')}
                  </p>
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
                    {isLoadingDashboard ? '...' : formatCurrency(dashboard?.stats.paidOut || 0, 'AED')}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Bookings</p>
                  <p className="text-3xl font-bold">
                    {isLoadingDashboard ? '...' : dashboard?.stats.totalBookings || 0}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        {dashboard?.recentBookings && dashboard.recentBookings.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest bookings for your activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {booking.bookingReference}
                        </span>
                        <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <p className="font-semibold">{booking.activityTitle}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{booking.customerName}</span>
                        <span>•</span>
                        <span>{formatDate(booking.selectedDate)}</span>
                        <span>•</span>
                        <span>{booking.numberOfParticipants} participant(s)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(booking.merchantAmount, booking.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Payout: {booking.payoutStatus}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Performance */}
        {dashboard?.activitiesWithStats && dashboard.activitiesWithStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Activity Performance</CardTitle>
              <CardDescription>Bookings and revenue by activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.activitiesWithStats
                  .filter((a) => a.bookingsCount > 0)
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{activity.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {activity.bookingsCount} booking(s)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(activity.revenue, 'AED')}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                {dashboard.activitiesWithStats.filter((a) => a.bookingsCount > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No bookings yet. Start promoting your activities!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle>My Activities</CardTitle>
            <CardDescription>View all your submitted activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No activities yet</p>
                <Button asChild>
                  <Link href="/merchant/add-activity">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Activity
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {activity.photos[0] && (
                        <img
                          src={activity.photos[0]}
                          alt={activity.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{activity.location}</p>
                        <p className="text-sm font-medium">
                          {activity.currency} {activity.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(activity.status)}
                      {activity.status === 'rejected' && activity.rejectionReason && (
                        <div className="text-sm text-muted-foreground max-w-xs">
                          <p className="font-medium">Reason:</p>
                          <p>{activity.rejectionReason}</p>
                        </div>
                      )}
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
