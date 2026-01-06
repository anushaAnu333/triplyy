'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/use-toast';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params?.token as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Link',
        description: 'The reset link is invalid or expired.',
        variant: 'destructive',
      });
      router.push('/forgot-password');
    }
  }, [token, router, toast]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful!',
        description: 'Your password has been reset. Please log in with your new password.',
      });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.response?.data?.message || 'Invalid or expired reset link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="font-display text-3xl">Password Reset!</CardTitle>
            <CardDescription>
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you to the login page...
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
