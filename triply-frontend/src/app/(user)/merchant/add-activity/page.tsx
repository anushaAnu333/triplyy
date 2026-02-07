'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { merchantActivitiesApi } from '@/lib/api/activities';
import { useQueryClient } from '@tanstack/react-query';
import { CURRENCIES, formatCurrencyDisplay } from '@/lib/currencies';

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  location: z.string().min(1, 'Location is required').max(200, 'Location cannot exceed 200 characters'),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  currency: z.string().default('AED'),
});

type ActivityFormData = z.infer<typeof activitySchema>;

export default function AddActivityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      currency: 'AED',
    },
  });

  const selectedCurrency = watch('currency');

  // Check if user is merchant
  if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
    router.push('/dashboard');
    return null;
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + photos.length > 3) {
      toast({
        title: 'Too many photos',
        description: 'You can upload a maximum of 3 photos',
        variant: 'destructive',
      });
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const onSubmit = async (data: ActivityFormData) => {
    if (photos.length === 0) {
      toast({
        title: 'Photos required',
        description: 'Please upload at least one photo',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await merchantActivitiesApi.submit({
        ...data,
        price: parseFloat(data.price),
        photos,
      });

      toast({
        title: 'Activity submitted!',
        description: 'Your activity has been submitted and is pending admin approval.',
      });

      queryClient.invalidateQueries({ queryKey: ['merchant-activities'] });
      router.push('/merchant/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit activity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Activity</CardTitle>
            <CardDescription>
              Submit your activity for review. Once approved, it will be visible to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Desert Safari Experience"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe your activity in detail..."
                  className="mt-1 min-h-[120px]"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g., Dubai, UAE"
                  className="mt-1"
                />
                {errors.location && (
                  <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                )}
              </div>

              {/* Price and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price')}
                    placeholder="0.00"
                    className="mt-1"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger id="currency" className="mt-1">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>
                  )}
                </div>
              </div>

              {/* Photos */}
              <div>
                <Label>Photos * (1-3 photos)</Label>
                <div className="mt-2 space-y-4">
                  {/* Photo Upload Area */}
                  {photos.length < 3 && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <Label htmlFor="photos" className="cursor-pointer">
                        <span className="text-primary font-medium">Click to upload</span> or drag and drop
                      </Label>
                      <Input
                        id="photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        PNG, JPG, WEBP up to 5MB each
                      </p>
                    </div>
                  )}

                  {/* Photo Previews */}
                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {photos.length === 0 && (
                  <p className="text-sm text-destructive mt-1">At least one photo is required</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Activity'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
