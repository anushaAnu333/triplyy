'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MerchantTermsAgreement } from '@/components/merchant/MerchantTermsAgreement';
import { useAuth } from '@/context/AuthContext';
import { hasMerchantTcAccepted } from '@/lib/merchant-onboarding/merchantTc';

export default function MerchantTermsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/become-merchant/terms');
      return;
    }
    if (user?.role === 'merchant') {
      router.replace('/merchant/dashboard');
      return;
    }
    if (user?.merchantTermsAcceptedAt || hasMerchantTcAccepted()) {
      router.replace('/become-merchant/onboarding');
    }
  }, [authLoading, isAuthenticated, user?.role, user?.merchantTermsAcceptedAt, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role === 'merchant') {
    return null;
  }

  if (user?.merchantTermsAcceptedAt || hasMerchantTcAccepted()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          <Link href="/become-merchant" className="text-primary hover:underline">
            ← Back to Become a Merchant
          </Link>
        </p>
        <MerchantTermsAgreement />
      </div>
    </div>
  );
}
