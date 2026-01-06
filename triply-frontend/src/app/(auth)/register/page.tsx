'use client';

import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Gift, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showReferralSection, setShowReferralSection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState<number | null>(null);
  const { register: registerUser } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const referralCode = watch('referralCode');

  // Validate referral code when user enters it
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 3) {
      setReferralDiscount(null);
      return;
    }

    setIsValidatingReferral(true);
    try {
      const { affiliatesApi } = await import('@/lib/api/affiliates');
      const result = await affiliatesApi.validateCode(code.toUpperCase());
      if (result.isValid && result.canUseForReferral) {
        const discount = result.discountAmount || 0;
        setReferralDiscount(discount);
        toast({
          title: 'Referral code valid!',
          description: `You'll receive AED ${discount.toFixed(0)} discount on your first booking.`,
        });
      } else if (result.isValid && !result.canUseForReferral) {
        setReferralDiscount(null);
        toast({
          title: 'Code cannot be used for signup',
          description: 'This code is only valid for bookings, not signup.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setReferralDiscount(null);
      toast({
        title: 'Invalid referral code',
        description: 'Please check your code and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidatingReferral(false);
    }
  };

  // Watch referral code changes
  React.useEffect(() => {
    if (referralCode) {
      const timeoutId = setTimeout(() => {
        validateReferralCode(referralCode);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setReferralDiscount(null);
    }
  }, [referralCode]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        referralCode: data.referralCode?.toUpperCase(),
      });
      toast({
        title: 'Registration successful!',
        description: referralDiscount 
          ? `Please check your email to verify your account. You'll receive AED ${referralDiscount.toFixed(0)} discount on your first booking!`
          : 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 pt-24">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">Create Account</CardTitle>
          <CardDescription>
            Join TRIPLY and start your travel adventure
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+971 50 123 4567"
                {...register('phoneNumber')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Referral Code Section */}
            <div className="space-y-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowReferralSection(!showReferralSection)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Gift className="w-4 h-4" />
                Have a referral code?
              </button>
              
              {showReferralSection && (
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code"
                      {...register('referralCode')}
                      className={referralDiscount ? 'border-green-500' : ''}
                    />
                    {isValidatingReferral && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {referralDiscount && !isValidatingReferral && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {referralDiscount && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Valid code! You'll receive AED {referralDiscount.toFixed(0)} discount on your first booking.
                    </p>
                  )}
                  {errors.referralCode && (
                    <p className="text-sm text-destructive">{errors.referralCode.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

