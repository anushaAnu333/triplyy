'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DestinationForm } from '@/components/admin/DestinationForm';

export default function NewDestinationPage() {
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
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/destinations" aria-label="Back to destinations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Add New Destination</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details for the travel destination
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <DestinationForm
            mode="create"
            onSuccess={() => router.push('/admin/destinations')}
            onCancel={() => router.push('/admin/destinations')}
          />
        </div>
      </div>
    </div>
  );
}
