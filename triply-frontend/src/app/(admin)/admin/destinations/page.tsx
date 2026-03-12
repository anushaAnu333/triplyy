'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, MapPin, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api/axios';

export default function AdminDestinationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-destinations', page, search],
    queryFn: () => destinationsApi.getAdminList({ page, limit: 10, search }),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/destinations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update destination', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/destinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete destination', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this destination? It will be hidden from the public site.'
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (destination: Destination) => {
    const nextActive = !destination.isActive;
    updateMutation.mutate(
      { id: destination._id, data: { isActive: nextActive } },
      {
        onSuccess: () =>
          toast({
            title: nextActive
              ? 'Destination is now visible to users'
              : 'Destination hidden from users',
          }),
      }
    );
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Manage Destinations</h1>
            <p className="text-muted-foreground">Add and manage travel destinations</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Button asChild>
              <Link href="/admin/destinations/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Destination
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4">
                  <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No destinations yet</h3>
              <p className="mb-6 text-muted-foreground">
                Start by adding your first travel destination
              </p>
              <Button asChild>
                <Link href="/admin/destinations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Destination
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((destination: Destination) => (
              <Card key={destination._id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  {destination.thumbnailImage ? (
                    <img
                      src={destination.thumbnailImage}
                      alt={destination.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium ${
                      destination.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {destination.isActive ? 'Visible to users' : 'Hidden'}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display mb-1 text-xl font-semibold">{destination.name}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {destination.country} • {destination.duration.days} days
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">
                      {formatCurrency(destination.depositAmount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={
                          destination.isActive ? 'Hide from users' : 'Show to users'
                        }
                        onClick={() => handleToggleActive(destination)}
                        disabled={updateMutation.isPending}
                      >
                        {destination.isActive ? (
                          <Circle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          href={`/admin/destinations/edit/${destination.slug}`}
                          aria-label={`Edit ${destination.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDelete(destination._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {destination.isActive
                      ? 'Visible on site'
                      : 'Hidden — click checkmark to show'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
