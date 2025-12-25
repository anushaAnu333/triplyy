'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Shield, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await updateUser(data);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle>{user?.firstName} {user?.lastName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
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
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+971 50 123 4567"
                    className="pl-10"
                    {...register('phoneNumber')}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isUpdating || !isDirty}>
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-muted-foreground">
                  {user?.isEmailVerified ? 'Your email is verified' : 'Please verify your email'}
                </p>
              </div>
              {user?.isEmailVerified ? (
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                  Verified
                </span>
              ) : (
                <Button variant="outline" size="sm">
                  Resend Email
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Account Type</p>
                <p className="text-sm text-muted-foreground">
                  Your current role and permissions
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                {user?.role}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Change your password
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Signup (if not already an affiliate) */}
        {user?.role === 'user' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Become an Affiliate</CardTitle>
              <CardDescription>
                Earn commissions by referring friends and family to TRIPLY
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Join Affiliate Program</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

