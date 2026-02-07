'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Calendar, DollarSign, TrendingUp, 
  MapPin, Clock, ArrowRight, BarChart3, Store
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import api from '@/lib/api/axios';

interface AdminStats {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    totalAffiliates: number;
  };
  bookings: {
    total: number;
    pending: number;
    depositPaid: number;
    datesSelected: number;
    confirmed: number;
    rejected: number;
    cancelled: number;
  };
  commissions: {
    pending: number;
    paid: number;
    total: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.data as AdminStats;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: async () => {
      const response = await api.get('/admin/recent-bookings?limit=5');
      return response.data.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
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
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your travel platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(stats?.overview.totalRevenue || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats?.overview.totalBookings || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats?.overview.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Affiliates</p>
                  <p className="text-3xl font-bold">{stats?.overview.totalAffiliates || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Booking Status Overview</CardTitle>
              <CardDescription>Current booking status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats?.bookings.pending || 0}
                  </p>
                  <p className="text-sm text-yellow-600">Pending Deposit</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {stats?.bookings.depositPaid || 0}
                  </p>
                  <p className="text-sm text-blue-600">Deposit Paid</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {stats?.bookings.datesSelected || 0}
                  </p>
                  <p className="text-sm text-purple-600">Awaiting Confirmation</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {stats?.bookings.confirmed || 0}
                  </p>
                  <p className="text-sm text-green-600">Confirmed</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">
                    {stats?.bookings.rejected || 0}
                  </p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">
                    {stats?.bookings.cancelled || 0}
                  </p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>Affiliate commission overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold">{formatCurrency(stats?.commissions.pending || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-bold text-green-600">{formatCurrency(stats?.commissions.paid || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="font-bold text-primary">{formatCurrency(stats?.commissions.total || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/bookings">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBookings?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings?.map((booking: any) => (
                  <div 
                    key={booking._id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.bookingReference}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.userId?.firstName} {booking.userId?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-5 gap-4 mt-6">
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link href="/admin/bookings">
              <Calendar className="w-6 h-6 mb-2" />
              <span>Manage Bookings</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link href="/admin/destinations">
              <MapPin className="w-6 h-6 mb-2" />
              <span>Destinations</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link href="/admin/activities">
              <Store className="w-6 h-6 mb-2" />
              <span>Activities</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link href="/admin/availability">
              <Clock className="w-6 h-6 mb-2" />
              <span>Availability</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <Link href="/admin/affiliates">
              <Users className="w-6 h-6 mb-2" />
              <span>Affiliates</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

