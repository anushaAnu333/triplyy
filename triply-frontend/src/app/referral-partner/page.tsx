'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  DollarSign, Users, TrendingUp, CheckCircle2, 
  ArrowRight, Copy, Share2, BarChart3, 
  CreditCard, Shield, Clock, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { affiliatesApi } from '@/lib/api/affiliates';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function ReferralPartnerPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleBecomeAffiliate = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push('/login?redirect=/referral-partner&action=become-affiliate');
      return;
    }

    if (user?.role === 'affiliate') {
      router.push('/affiliate/dashboard');
      return;
    }

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
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display">
              Become a Referral Partner
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our affiliate program and start earning commissions by sharing TRIPLY with your network
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated && user?.role === 'affiliate' ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/affiliate/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={handleBecomeAffiliate}
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
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  {!isAuthenticated && (
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="text-lg px-8 py-6"
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start earning in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle>Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Register as a referral partner and get your unique referral code instantly
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle>Share Your Code</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share your referral code with friends, family, and your network through any channel
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle>Earn Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get paid when someone books a trip using your referral code
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              Why Become a Partner?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed as a referral partner
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-3xl font-display">Partner Benefits</CardTitle>
                <CardDescription className="text-lg">
                  What you get when you join our referral program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-lg">{benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-brand-orange to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
              Ready to Start Earning?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of referral partners already earning with TRIPLY
            </p>
            <Button 
              size="lg" 
              className="bg-white text-brand-orange hover:bg-white/90 text-lg px-8 py-6"
              onClick={handleBecomeAffiliate}
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
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

