'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { PackageGenericForm } from '../../../../../components/admin/PackageGenericForm';

export default function AdminNewPackagePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin/packages">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">New package</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogue-style offer: duration, itineraries, USD table, hotels — no deposit field.
          </p>
        </div>

        <PackageGenericForm
          mode="create"
          initialData={null}
          onSuccess={() => router.push('/admin/packages')}
          onCancel={() => router.push('/admin/packages')}
        />
      </div>
    </div>
  );
}
