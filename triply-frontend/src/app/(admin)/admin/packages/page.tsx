'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit, Eye, Trash2, Search, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { packagesApi, TripPackage } from '@/lib/api/packages';

export default function AdminPackagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-packages', search],
    queryFn: () => packagesApi.getAdminList({ page: 1, limit: 50, search }),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ title: 'Package deactivated' });
    },
    onError: () => toast({ title: 'Failed to update package', variant: 'destructive' }),
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleDelete = (id: string) => {
    if (confirm('Deactivate this package? It will be hidden from the public packages page.')) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const rows = data?.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Promotional packages
            </h1>
            <p className="text-muted-foreground mt-1">
              Separate from destinations — enquiry-first catalogue packages (pricing & itineraries in admin).
            </p>
          </div>
          <Button asChild className="bg-brand-orange hover:bg-brand-orange/90">
            <Link href="/admin/packages/new">
              <Plus className="h-4 w-4 mr-2" />
              New package
            </Link>
          </Button>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((pkg: TripPackage) => (
              <Card key={pkg._id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {pkg.location}
                    </p>
                    <p className="text-sm mt-1">
                      {pkg.priceLabel?.trim()
                        ? pkg.priceLabel
                        : pkg.pricingTable
                          ? `${pkg.pricingTable.currency} table`
                          : 'No price label'}
                      {pkg.duration ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {pkg.duration.days}D{pkg.duration.nights}N
                        </span>
                      ) : null}
                      {pkg.promotionEndDate ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · Valid until {format(new Date(pkg.promotionEndDate), 'MMM yyyy')}
                        </span>
                      ) : null}
                      {' · '}
                      <span className={pkg.isActive ? 'text-green-600' : 'text-muted-foreground'}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pkg.isActive ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/packages/${encodeURIComponent(pkg.slug)}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Inactive packages are hidden from the public catalogue"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/packages/${pkg._id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(pkg._id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rows.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No packages yet. Create one to show on /packages.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
