'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, CreditCard, Check, ArrowLeft, 
  Lock, Calendar, MapPin 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { formatCurrency } from '@/lib/utils';

type PaymentMethod = 'card' | 'debit' | 'credit';

interface PaymentFormData {
  paymentMethod: PaymentMethod;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingId = params.bookingId as string;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentMethod: 'card',
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [activityAmount, setActivityAmount] = useState<number>(0);
  const [hasActivities, setHasActivities] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('AED');

  // Fetch booking details
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking) {
      // If payment is already completed, redirect to success page
      if (booking.status === 'deposit_paid' || booking.depositPayment?.paymentStatus === 'completed') {
        router.push(`/payment/${bookingId}/success`);
        return;
      }

      // Extract payment intent ID from booking if available
      // Get it from localStorage (stored during booking creation)
      const storedPaymentData = localStorage.getItem(`payment_${bookingId}`);
      if (storedPaymentData) {
        try {
          const data = JSON.parse(storedPaymentData);
          setPaymentIntentId(data.paymentIntentId || '');
          setDepositAmount(data.depositAmount || booking.depositPayment?.amount || 0);
          setTotalAmount(data.totalAmount || data.depositAmount || booking.depositPayment?.amount || 0);
          setActivityAmount(data.activityAmount || 0);
          setHasActivities(data.hasActivities || false);
          setCurrency(data.currency || booking.depositPayment?.currency || 'AED');
        } catch (error) {
          console.error('Error parsing payment data:', error);
          // Fallback to booking data
          const deposit = booking.depositPayment?.amount || 0;
          setDepositAmount(deposit);
          setTotalAmount(deposit);
          setActivityAmount(0);
          setHasActivities(false);
          setCurrency(booking.depositPayment?.currency || 'AED');
        }
      } else {
        // Fallback to booking data
        const deposit = booking.depositPayment?.amount || 0;
        setDepositAmount(deposit);
        setTotalAmount(deposit);
        setActivityAmount(0);
        setHasActivities(!!(booking.linkedActivityBookings && booking.linkedActivityBookings.length > 0));
        setCurrency(booking.depositPayment?.currency || 'AED');
      }
    }
  }, [booking, bookingId, router]);

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    handleInputChange('cardNumber', formatted);
  };

  const handleExpiryChange = (field: 'expiryMonth' | 'expiryYear', value: string) => {
    handleInputChange(field, value);
  };

  const validateForm = (): boolean => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: 'Invalid Card Number',
        description: 'Please enter a valid 16-digit card number',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.cardHolderName || formData.cardHolderName.trim().length < 3) {
      toast({
        title: 'Invalid Card Holder Name',
        description: 'Please enter the card holder name',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      toast({
        title: 'Invalid Expiry Date',
        description: 'Please select expiry month and year',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      toast({
        title: 'Invalid CVV',
        description: 'Please enter a valid CVV',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get paymentIntentId - check state first, then localStorage
    let finalPaymentIntentId = paymentIntentId;
    if (!finalPaymentIntentId) {
      const storedPaymentData = localStorage.getItem(`payment_${bookingId}`);
      if (storedPaymentData) {
        try {
          const data = JSON.parse(storedPaymentData);
          if (data.paymentIntentId) {
            finalPaymentIntentId = data.paymentIntentId;
            setPaymentIntentId(data.paymentIntentId);
          }
        } catch (error) {
          console.error('Error parsing payment data:', error);
        }
      }
    }

    if (!finalPaymentIntentId) {
      toast({
        title: 'Payment Error',
        description: 'Payment intent not found. Please try booking again or contact support.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentsApi.confirm({
        paymentIntentId: finalPaymentIntentId,
        bookingId,
      });

      // Payment successful - navigate to success page
      router.push(`/payment/${bookingId}/success`);
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.message || error.message || 'Unable to process payment',
        variant: 'destructive',
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month.toString().padStart(2, '0');
  });

  if (isLoadingBooking) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Booking not found</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Complete your booking by making the deposit payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      setPaymentMethod(value as PaymentMethod);
                      handleInputChange('paymentMethod', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="credit">Credit Card (Visa/Mastercard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Card Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardHolderName">Card Holder Name</Label>
                  <Input
                    id="cardHolderName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.cardHolderName}
                    onChange={(e) => handleInputChange('cardHolderName', e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Expiry Month</Label>
                    <Select
                      value={formData.expiryMonth}
                      onValueChange={(value) => handleExpiryChange('expiryMonth', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="expiryMonth">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Expiry Year</Label>
                    <Select
                      value={formData.expiryYear}
                      onValueChange={(value) => handleExpiryChange('expiryYear', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="expiryYear">
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay {formatCurrency(totalAmount || depositAmount, currency)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Destination</span>
                </div>
                <p className="font-semibold">
                  {typeof booking.destinationId === 'object' 
                    ? booking.destinationId.name?.en || 'N/A'
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Travellers</span>
                </div>
                <p className="font-semibold">{booking.numberOfTravellers} {booking.numberOfTravellers === 1 ? 'Person' : 'People'}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destination Deposit</span>
                  <span className="font-semibold">
                    {formatCurrency(depositAmount, currency)}
                  </span>
                </div>
                {hasActivities && activityAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Activities</span>
                    <span className="font-semibold">
                      {formatCurrency(activityAmount, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount || depositAmount, currency)}</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

