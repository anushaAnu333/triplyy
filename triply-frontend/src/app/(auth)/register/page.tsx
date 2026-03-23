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

  // Check for referral code in URL
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        setValue('referralCode', refCode.toUpperCase());
        setShowReferralSection(true);
        validateReferralCode(refCode.toUpperCase());
      }
    }
  }, [setValue]);

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
          title: 'Referral code applied!',
          description: "Your friend will be rewarded for this booking. Thank you!",
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
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4 pt-20 sm:pt-24">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-3 sm:px-6">
          <CardTitle className="font-display text-2xl sm:text-3xl">Create Account</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Join TRIPLY and start your travel adventure
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="firstName" className="text-sm">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="lastName" className="text-sm">Last Name</Label>
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

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
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

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+971 50 123 4567"
                {...register('phoneNumber')}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
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

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder=""
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Referral Code Section */}
            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowReferralSection(!showReferralSection)}
                className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
              >
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Have a referral code?</span>
              </button>
              
              {showReferralSection && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="referralCode" className="text-sm">Referral Code (Optional)</Label>
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
                    <p className="text-xs sm:text-sm text-green-600 font-medium">
                      ✓ Valid referral code! This booking will count towards your referrer&apos;s reward.
                    </p>
                  )}
                  {errors.referralCode && (
                    <p className="text-sm text-destructive">{errors.referralCode.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-6 pb-4 sm:pb-6">
            <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>

            <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
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

