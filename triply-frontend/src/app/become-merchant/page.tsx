'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { merchantActivitiesApi } from '@/lib/api/activities';
import Link from 'next/link';

export default function BecomeMerchantPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleBecomeMerchant = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push('/login?redirect=/become-merchant&action=become-merchant');
      return;
    }

    if (user?.role === 'merchant') {
      router.push('/merchant/dashboard');
      return;
    }

    setIsRegistering(true);
    try {
      await merchantActivitiesApi.register();
      
      toast({
        title: 'Success!',
        description: 'You are now a merchant! Please log in again to access your dashboard.',
      });
      
      // Clear the old token and redirect to login
      // The user will get a new token with the updated role when they log in
      setTimeout(async () => {
        await logout();
        router.push('/login?registered=merchant&redirect=/merchant/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Unable to register as merchant',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const features = [
    {
      icon: Store,
      title: 'List Your Activities',
      description: 'Submit your tours, experiences, and activities for review. Once approved, they\'ll be visible to thousands of customers.',
    },
    {
      icon: DollarSign,
      title: 'Direct Bookings',
      description: 'Receive inquiries directly from customers. You handle payments and provide 20% commission to TRIPLY.',
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
    'Simple commission structure (20%)',
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Become a Merchant Partner
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            List your activities and experiences on TRIPLY. Reach more customers and grow your business.
          </p>
          
          {!isAuthenticated ? (
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/login?redirect=/become-merchant">
                  Sign In to Get Started
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="/register?redirect=/become-merchant">
                  Create Account
                </Link>
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
              onClick={handleBecomeMerchant}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Become a Merchant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
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
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Register as Merchant</h3>
                <p className="text-muted-foreground">
                  Click "Become a Merchant" to register your account as a merchant partner.
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
                  Customers can book your activity. You'll receive inquiries via email with customer details.
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
                  Customer pays you directly. You pay TRIPLY 20% commission after the booking is completed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <Card className="max-w-3xl mx-auto">
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

        {/* CTA */}
        {isAuthenticated && user?.role !== 'merchant' && (
          <div className="text-center mt-16">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={handleBecomeMerchant}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Become a Merchant Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
