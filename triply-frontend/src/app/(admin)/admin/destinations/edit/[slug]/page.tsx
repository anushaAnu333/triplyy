'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DestinationForm } from '@/components/admin/DestinationForm';
import { destinationsApi } from '@/lib/api/destinations';

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const {
    data: destination,
    isLoading: loadingDestination,
    isError: loadError,
  } = useQuery({
    queryKey: ['destination-edit', slug],
    queryFn: () => destinationsApi.getAdminBySlug(slug),
    enabled: isAuthenticated && user?.role === 'admin' && !!slug,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!slug || loadingDestination) return;
    if (loadError) {
      toast({ title: 'Destination not found', variant: 'destructive' });
      router.push('/admin/destinations');
    }
  }, [slug, loadingDestination, loadError, toast, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!slug || loadError) {
    return null;
  }

  if (loadingDestination || !destination) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/destinations" aria-label="Back to destinations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Destination</h1>
            <p className="text-sm text-muted-foreground">{destination.name}</p>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <DestinationForm
            mode="edit"
            initialData={destination}
            onSuccess={() => router.push('/admin/destinations')}
            onCancel={() => router.push('/admin/destinations')}
          />
        </div>
      </div>
    </div>
  );
}
