'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { activitiesApi, Activity } from '@/lib/api/activities';

const inquirySchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Please enter a valid email'),
  customerPhone: z.string().min(1, 'Phone number is required'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  message: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface ActivityInquiryModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityInquiryModal({
  activity,
  isOpen,
  onClose,
}: ActivityInquiryModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      await activitiesApi.submitInquiry(activity._id, data);
      toast({
        title: 'Inquiry submitted!',
        description: 'The activity operator will contact you shortly.',
      });
      reset();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit inquiry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book {activity.title}</DialogTitle>
          <DialogDescription>
            Fill out the form below and the activity operator will contact you to confirm your booking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              {...register('customerName')}
              placeholder="Your full name"
              className="mt-1"
            />
            {errors.customerName && (
              <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerEmail">Email *</Label>
            <Input
              id="customerEmail"
              type="email"
              {...register('customerEmail')}
              placeholder="your.email@example.com"
              className="mt-1"
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive mt-1">{errors.customerEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerPhone">Phone *</Label>
            <Input
              id="customerPhone"
              {...register('customerPhone')}
              placeholder="+971 XX XXX XXXX"
              className="mt-1"
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive mt-1">{errors.customerPhone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="preferredDate">Preferred Date *</Label>
            <Input
              id="preferredDate"
              type="date"
              {...register('preferredDate')}
              className="mt-1"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.preferredDate && (
              <p className="text-sm text-destructive mt-1">{errors.preferredDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Any special requests or questions..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Inquiry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
