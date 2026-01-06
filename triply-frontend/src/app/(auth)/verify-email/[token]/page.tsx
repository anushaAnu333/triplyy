'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/use-toast';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params?.token as string;

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsLoading(false);
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setIsSuccess(true);
        toast({
          title: 'Email Verified!',
          description: 'Your email has been successfully verified.',
        });
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 2000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Invalid or expired verification link';
        setError(errorMessage);
        toast({
          title: 'Verification Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="font-display text-3xl">Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="font-display text-3xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email address has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              You can now log in to your account. Redirecting you to the login page...
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login?verified=true">Go to Login</Link>
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
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="font-display text-3xl">Verification Failed</CardTitle>
          <CardDescription>
            {error || 'Invalid or expired verification link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            The verification link may have expired or is invalid. Please request a new verification email.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Create New Account</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
