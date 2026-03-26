'use client';

import { Suspense, useEffect, useState } from 'react';
import { Store, DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MerchantTermsAgreement } from '@/components/merchant/MerchantTermsAgreement';
import { getMyOnboardingStatus } from '@/lib/api/merchantOnboarding';

const LOGIN_REDIRECT = encodeURIComponent('/become-merchant?openTerms=1');

function BecomeMerchantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [termsOpen, setTermsOpen] = useState(false);

  const { data: myOnboardingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['my-merchant-onboarding-status'],
    queryFn: () => getMyOnboardingStatus(),
    enabled: isAuthenticated && user?.role !== 'merchant',
    staleTime: 30_000,
  });

  const inReview =
    myOnboardingStatus?.status === 'pending' || myOnboardingStatus?.status === 'reapplied';

  useEffect(() => {
    if (
      searchParams.get('openTerms') === '1' &&
      isAuthenticated &&
      user?.role !== 'merchant' &&
      !statusLoading &&
      !inReview
    ) {
      setTermsOpen(true);
    }
  }, [searchParams, isAuthenticated, user?.role, statusLoading, inReview]);

  const features = [
    {
      icon: Store,
      title: 'List Your Activities',
      description:
        "Submit your tours, experiences, and activities for review. Once approved, they'll be visible to thousands of customers.",
    },
    {
      icon: DollarSign,
      title: 'Direct Bookings',
      description:
        'Receive inquiries directly from customers. Triply collects the payment, keeps 20% commission, and releases 80% to you after the guest completes the activity (payout window: 14 days).',
    },
    {
      icon: Users,
      title: 'Reach More Customers',
      description: 'Get exposure on our platform and reach customers looking for unique experiences.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Track your activity performance and grow your tour business with our platform.',
    },
  ];

  const benefits = [
    'Easy activity submission process',
    'Admin approval system for quality control',
    'Direct customer communication',
    'Simple commission structure (Triply keeps 20%; you receive 80% after payout window)',
    'Track all your activities in one dashboard',
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-20">
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-1 px-6 pt-6 pb-4 text-left border-b border-border/60 bg-muted/20">
            <DialogTitle className="text-lg font-semibold tracking-tight">Merchant partner terms</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Scroll through the terms, then accept to continue onboarding.{' '}
              <Link href="/become-merchant/terms" className="text-primary font-medium underline-offset-4 hover:underline">
                Open full page
              </Link>
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <MerchantTermsAgreement
              variant="dialog"
              onSuccess={() => {
                setTermsOpen(false);
                router.push('/become-merchant/onboarding');
              }}
              onDecline={() => setTermsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Merchant Partner</h1>
          <p className="text-xl text-muted-foreground mb-8">
            List your activities and experiences on TRIPLY. Reach more customers and grow your business.
          </p>

          {!isAuthenticated ? (
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href={`/login?redirect=${LOGIN_REDIRECT}`}>Sign In to Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href={`/register?redirect=${LOGIN_REDIRECT}`}>Create Account</Link>
              </Button>
            </div>
          ) : user?.role === 'merchant' ? (
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/merchant/dashboard">
                Go to Merchant Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              className="text-lg px-8"
              type="button"
              disabled={inReview || statusLoading}
              onClick={() => {
                if (inReview) return;
                setTermsOpen(true);
              }}
            >
              {inReview ? (
                <>
                  In review
                  <Clock className="ml-2 h-5 w-5" />
                </>
              ) : statusLoading ? (
                'Checking...'
              ) : (
                <>
                  Start onboarding
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works + Benefits (row on desktop) */}
        <div className="max-w-6xl mx-auto mb-12 grid gap-8 md:grid-cols-2 md:items-start">
          <div className="w-full">
            <h2 className="text-3xl font-bold text-center md:text-left mb-6">How It Works</h2>
            <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Register as Merchant</h3>
                <p className="text-muted-foreground">
                  Click &quot;Become a Merchant&quot; to register your account as a merchant partner.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Submit Activities</h3>
                <p className="text-muted-foreground">
                  Fill out the activity form with title, description, location, price, and upload 1-3 photos.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Admin Approval</h3>
                <p className="text-muted-foreground">
                  Our admin team reviews your activity. Once approved, it appears on the Browse Activities page.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Receive Inquiries</h3>
                <p className="text-muted-foreground">
                  Customers can book your activity. You&apos;ll receive inquiries via email with customer details.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Handle Payment</h3>
                <p className="text-muted-foreground">
                  Customer pays to Triply. Triply keeps 20% commission and releases 80% to you after the guest completes the trip/activity.
                  Payout timing: 14 days after completion.
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* Benefits */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Benefits of Being a Merchant</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default function BecomeMerchantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <BecomeMerchantContent />
    </Suspense>
  );
}
