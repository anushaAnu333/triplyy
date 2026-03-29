'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Shield,
  Award,
} from 'lucide-react';
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
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ReferralPartnerTermsAgreement } from '@/components/referral/ReferralPartnerTermsAgreement';
import { affiliatesApi } from '@/lib/api/affiliates';

function ReferralPartnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [termsOpen, setTermsOpen] = useState(false);

  const { data: onboardingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['referral-partner-onboarding-status'],
    queryFn: () => affiliatesApi.getReferralPartnerOnboardingStatus(),
    enabled: isAuthenticated && user?.role === 'user',
    staleTime: 30_000,
  });

  const inReview =
    onboardingStatus?.status === 'pending' || onboardingStatus?.status === 'reapplied';

  useEffect(() => {
    if (
      searchParams.get('openTerms') === '1' &&
      isAuthenticated &&
      user?.role === 'user' &&
      !statusLoading &&
      !inReview
    ) {
      setTermsOpen(true);
    }
  }, [searchParams, isAuthenticated, user?.role, statusLoading, inReview]);

  const features = [
    {
      icon: DollarSign,
      title: 'Earn Commissions',
      description: 'Get paid for every booking made with your unique referral code',
    },
    {
      icon: Users,
      title: 'Easy Sharing',
      description: 'Share your code via social media, email, or direct link',
    },
    {
      icon: TrendingUp,
      title: 'Track Performance',
      description: 'Monitor your referrals, earnings, and commission status in real-time',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Reliable and secure commission payouts',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'View comprehensive reports on your referral performance',
    },
    {
      icon: Award,
      title: 'No Limits',
      description: 'Unlimited referrals and earning potential',
    },
  ];

  const benefits = [
    'Commission on every successful qualifying booking',
    'Real-time tracking of your referrals',
    'Easy-to-share unique referral codes',
    'Detailed dashboard with analytics',
    'Secure and timely commission payouts',
    'Support from our affiliate team',
  ];

  const handlePrimaryCta = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/referral-partner&openTerms=1');
      return;
    }
    if (user?.role === 'affiliate') {
      router.push('/affiliate/dashboard');
      return;
    }
    if (user?.role === 'merchant') {
      return;
    }
    if (user?.role !== 'user') {
      return;
    }
    if (inReview) {
      return;
    }
    if (user?.referralPartnerTermsAcceptedAt) {
      router.push('/referral-partner/onboarding');
      return;
    }
    setTermsOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-1 px-6 pt-6 pb-4 text-left border-b border-border/60 bg-muted/20">
            <DialogTitle className="text-lg font-semibold tracking-tight">Referral partner terms</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Scroll through the terms loaded from our servers, then accept to continue.{' '}
              <Link href="/referral-partner/terms" className="text-primary font-medium underline-offset-4 hover:underline">
                Open full page
              </Link>
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <ReferralPartnerTermsAgreement
              variant="dialog"
              onSuccess={() => {
                setTermsOpen(false);
                router.push('/referral-partner/onboarding');
              }}
              onDecline={() => setTermsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <section className="relative py-12 sm:py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-primary/5 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 font-display">
              Become a Referral Partner
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-1">
              Earn commissions by sharing TRIPLY. Terms and payout details are verified through the same onboarding
              process as merchant partners (without listing activities).
            </p>

            {isAuthenticated && user?.role === 'merchant' && (
              <div className="mb-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-left max-w-xl mx-auto">
                Referral partner onboarding is for standard accounts. If you need a referral code as a merchant,
                please contact{' '}
                <a href="mailto:hello@triplysquads.com" className="text-primary font-medium underline">
                  hello@triplysquads.com
                </a>
                .
              </div>
            )}

            {isAuthenticated && user?.role === 'user' && inReview && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Your referral partner application is <strong>under review</strong>. We will email you when it is
                approved.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {isAuthenticated && user?.role === 'affiliate' ? (
                <Button asChild size="lg" className="text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                  <Link href="/affiliate/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-6"
                    onClick={handlePrimaryCta}
                    disabled={
                      (isAuthenticated && user?.role === 'user' && inReview) ||
                      (isAuthenticated && user?.role === 'merchant') ||
                      (isAuthenticated &&
                        user != null &&
                        user.role !== 'user' &&
                        user.role !== 'affiliate' &&
                        user.role !== 'merchant')
                    }
                  >
                    {isAuthenticated && user?.role === 'user' && inReview
                      ? 'Application in review'
                      : isAuthenticated
                        ? 'Continue application'
                        : 'Get Started'}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  {!isAuthenticated && (
                    <Button asChild variant="outline" size="lg" className="text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6">
                      <Link href="/login?redirect=/referral-partner&openTerms=1">Already have an account? Login</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 font-display">How It Works</h2>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Accept terms, submit your details for verification, then receive your code after admin approval
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Apply</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Accept the referral partner terms and complete onboarding (profile, bank details, documents).
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Get approved</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Our team reviews your application. Once approved, your referral partner account and code are
                  activated.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Earn</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Share your code and track commissions in your affiliate dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 font-display">
              Why Become a Partner?
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed as a referral partner
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2 sm:mb-4" />
                  <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-3xl font-display">Partner Benefits</CardTitle>
                <CardDescription className="text-sm sm:text-lg">
                  What you get when you join our referral program
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-lg">{benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-br from-brand-orange to-orange-600 text-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 font-display">Ready to Start Earning?</h2>
            <p className="text-sm sm:text-xl mb-6 sm:mb-8 text-white/90">
              Join referral partners earning with TRIPLY
            </p>
            <Button
              size="lg"
              className="bg-white text-brand-orange hover:bg-white/90 text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
              onClick={handlePrimaryCta}
              disabled={
                (isAuthenticated && user?.role === 'user' && inReview) ||
                (isAuthenticated && user?.role === 'merchant') ||
                (isAuthenticated &&
                  user != null &&
                  user.role !== 'user' &&
                  user.role !== 'affiliate' &&
                  user.role !== 'merchant')
              }
            >
              {isAuthenticated && user?.role === 'user' && inReview
                ? 'Application in review'
                : isAuthenticated
                  ? 'Continue application'
                  : 'Get Started Today'}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ReferralPartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-6">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ReferralPartnerContent />
    </Suspense>
  );
}
