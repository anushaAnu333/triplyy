'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, Users, TrendingUp, CheckCircle2, 
  ArrowRight, BarChart3, Shield, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { affiliatesApi } from '@/lib/api/affiliates';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const REFERRAL_PARTNER_TERMS = `TR✨PLY Referral Partner Program
Terms & Conditions

Please read these terms carefully. By clicking "I Agree & Join", you confirm that you have read, understood, and agree to be bound by the following terms, which constitute a legally binding agreement under the laws of the United Arab Emirates.

1. Program Overview

The TR✨PLY Referral Partner Program ("Program") is operated by TR✨PLY Travel and Tourism FZE LLC ("TR✨PLY", "we", "us"), a company registered in the Ajman Free Zone, UAE. The Program allows eligible individuals ("Referral Partner", "you") to earn commission by referring new customers who complete a paid booking through TR✨PLY.

2. Eligibility

To participate in this Program, you must: (a) be 18 years of age or older; (b) hold a valid government-issued ID (Passport or UAE Emirates ID); (c) possess a valid bank account for commission payouts; and (d) not be an employee, director, or agent of TR✨PLY. TR✨PLY reserves the right to verify your identity and bank details prior to any commission disbursement.

3. Commission Structure

Referral Partners earn a commission of AED 20 per successful booking made by a referred customer using your unique referral code. Commissions are calculated based on confirmed, fully paid bookings only. Cancelled or refunded bookings do not qualify for commission. Commissions are paid on a monthly basis, on or before the 15th of each calendar month, for bookings confirmed in the previous month.

4. Payment & Disbursement

Commission payments will be transferred to the verified bank account on record. A minimum payout threshold of AED 50 applies — balances below this threshold will roll over to the following month. TR✨PLY is not liable for failed transfers due to incorrect banking information provided by the Referral Partner. It is the Referral Partner's responsibility to ensure bank details are current and accurate.

5. Referral Code Usage

Your referral code is personal and non-transferable. You may share your referral code with friends, family, or any third party through personal, non-commercial means. Mass distribution via spam, paid advertisements, or misleading promotions is strictly prohibited. TR✨PLY reserves the right to revoke your referral code if misuse is detected, without prior notice.

6. Anti-Fraud & Prohibited Conduct

Any attempt to manipulate the referral system — including self-referrals, fictitious bookings, or collusion — constitutes fraud and is a violation of UAE Federal Law No. 5 of 2012 on Combating Cybercrimes. TR✨PLY reserves the right to withhold commissions, terminate your participation, and pursue legal action where applicable.

7. Data Privacy

By joining this Program, you consent to TR✨PLY collecting and processing your personal data (including name, contact details, ID, and bank information) solely for the purpose of administering the Program, in accordance with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection. Your data will not be sold or shared with third parties without your consent.

8. Program Changes & Termination

TR✨PLY reserves the right to modify, suspend, or terminate this Program at any time. Material changes will be communicated via email to the address registered with your account. Continued participation after notice of changes constitutes acceptance of the updated terms. Either party may terminate participation with 7 days' written notice.

9. Limitation of Liability

TR✨PLY's total liability to any Referral Partner shall not exceed the total commissions earned and unpaid at the time of any claim. TR✨PLY is not liable for indirect, incidental, or consequential losses arising from participation in this Program.

10. Governing Law & Dispute Resolution

These terms are governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising under this agreement shall be subject to the exclusive jurisdiction of the courts of the Ajman Free Zone, UAE. Both parties agree to attempt resolution through good-faith negotiation before initiating formal proceedings.

For questions regarding this Program, contact us at hello@triplysquads.com or call +971 52 516 3595. Last updated: March 2026.`;

export default function ReferralPartnerPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const checkScrollBottom = useCallback(() => {
    const el = termsScrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setHasScrolledToBottom(atBottom);
  }, []);

  const handleOpenTerms = () => {
    setTermsModalOpen(true);
    setTermsAgreed(false);
    setHasScrolledToBottom(false);
    setTimeout(() => checkScrollBottom(), 100);
  };

  const handleCloseTerms = () => {
    setTermsModalOpen(false);
    setTermsAgreed(false);
    setHasScrolledToBottom(false);
  };

  const handleBecomeAffiliateClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/referral-partner&action=become-affiliate');
      return;
    }
    if (user?.role === 'affiliate') {
      router.push('/affiliate/dashboard');
      return;
    }
    handleOpenTerms();
  };

  const handleBecomeAffiliateAfterTerms = async () => {
    if (!termsAgreed || !hasScrolledToBottom) return;
    setTermsModalOpen(false);
    setIsRegistering(true);
    try {
      await affiliatesApi.register();
      
      // The backend has updated the user's role to 'affiliate'
      // However, the JWT token still contains the old role
      // We need to get a new token by logging out and logging back in
      toast({
        title: 'Success!',
        description: 'You are now a referral partner! Please log in again to access your dashboard.',
      });
      
      // Clear the old token and redirect to login
      // The user will get a new token with the updated role when they log in
      setTimeout(async () => {
        await logout();
        router.push('/login?registered=affiliate&redirect=/affiliate/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Unable to register as affiliate',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

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
    '10% commission on every successful booking',
    'Real-time tracking of your referrals',
    'Easy-to-share unique referral codes',
    'Detailed dashboard with analytics',
    'Secure and timely commission payouts',
    'Support from our affiliate team',
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Terms & Conditions Modal */}
      <Dialog open={termsModalOpen} onOpenChange={(open) => !open && handleCloseTerms()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-display">
              TR✨PLY Referral Partner Program
            </DialogTitle>
            <DialogDescription className="sr-only">
              Terms & Conditions
            </DialogDescription>
          </DialogHeader>
          <div
            ref={termsScrollRef}
            onScroll={checkScrollBottom}
            className="flex-1 min-h-0 overflow-y-auto border rounded-md p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
          >
            {REFERRAL_PARTNER_TERMS}
          </div>
          {hasScrolledToBottom && (
            <p className="text-xs sm:text-sm text-green-600 font-medium">
              You have read all terms. You may now agree.
            </p>
          )}
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="terms-agree"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 flex-shrink-0 cursor-pointer"
            />
            <label
              htmlFor="terms-agree"
              className="text-xs sm:text-sm text-foreground cursor-pointer leading-tight"
            >
              I have read and agree to the TR✨PLY Referral Partner Terms &amp; Conditions. I understand this serves as a binding agreement.
            </label>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={handleCloseTerms} className="w-full sm:w-auto">
              Decline
            </Button>
            <Button
              onClick={handleBecomeAffiliateAfterTerms}
              disabled={!termsAgreed || !hasScrolledToBottom || isRegistering}
              className="w-full sm:w-auto"
            >
              {isRegistering ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Registering...
                </>
              ) : (
                'I Agree & Join Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-primary/5 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 font-display">
              Become a Referral Partner
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-1">
              Join our affiliate program and start earning commissions by sharing TRIPLY with your network
            </p>
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
                    onClick={handleBecomeAffiliateClick}
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        {isAuthenticated ? 'Become a Partner' : 'Get Started'}
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                  {!isAuthenticated && (
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6"
                    >
                      <Link href="/login?redirect=/referral-partner&action=become-affiliate">
                        Already have an account? Login
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 font-display">
              How It Works
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start earning in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Sign Up</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Register as a referral partner and get your unique referral code instantly
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Share Your Code</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Share your referral code with friends, family, and your network through any channel
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Earn Commissions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-base text-muted-foreground">
                  Get paid when someone books a trip using your referral code
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
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

      {/* Benefits */}
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

      {/* CTA Section */}
      <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-br from-brand-orange to-orange-600 text-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 font-display">
              Ready to Start Earning?
            </h2>
            <p className="text-sm sm:text-xl mb-6 sm:mb-8 text-white/90">
              Join thousands of referral partners already earning with TRIPLY
            </p>
            <Button 
              size="lg" 
              className="bg-white text-brand-orange hover:bg-white/90 text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
              onClick={handleBecomeAffiliateClick}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  {isAuthenticated ? 'Become a Partner Now' : 'Get Started Today'}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

