'use client';

import { useState, useEffect } from 'react';
import { Loader2, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

type PaymentMethod = 'bank_transfer' | 'paypal' | 'stripe' | 'other';

export function WithdrawalModal({ 
  isOpen, 
  onClose, 
  availableBalance 
}: WithdrawalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [amount, setAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    iban: '',
    swiftCode: '',
    paypalEmail: '',
    stripeAccountId: '',
    otherDetails: '',
  });

  // Get approved commissions
  const { data: approvedCommissions } = useQuery({
    queryKey: ['affiliate-commissions-approved'],
    queryFn: () => affiliatesApi.getCommissions(1, 100, 'approved'),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setPaymentMethod('bank_transfer');
      setPaymentDetails({
        accountName: '',
        accountNumber: '',
        bankName: '',
        iban: '',
        swiftCode: '',
        paypalEmail: '',
        stripeAccountId: '',
        otherDetails: '',
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return false;
    }

    if (parseFloat(amount) > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You can only withdraw up to ${formatCurrency(availableBalance)}`,
        variant: 'destructive',
      });
      return false;
    }

    if (paymentMethod === 'bank_transfer') {
      if (!paymentDetails.accountName || !paymentDetails.accountNumber || !paymentDetails.bankName) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required bank transfer details',
          variant: 'destructive',
        });
        return false;
      }
    } else if (paymentMethod === 'paypal') {
      if (!paymentDetails.paypalEmail) {
        toast({
          title: 'Missing Information',
          description: 'Please enter your PayPal email',
          variant: 'destructive',
        });
        return false;
      }
    } else if (paymentMethod === 'stripe') {
      if (!paymentDetails.stripeAccountId) {
        toast({
          title: 'Missing Information',
          description: 'Please enter your Stripe account ID',
          variant: 'destructive',
        });
        return false;
      }
    } else if (paymentMethod === 'other') {
      if (!paymentDetails.otherDetails) {
        toast({
          title: 'Missing Information',
          description: 'Please provide payment details',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get commission IDs for approved commissions (up to the withdrawal amount)
      const commissionIds: string[] = [];
      let remainingAmount = parseFloat(amount);
      
      if (approvedCommissions?.data) {
        for (const commission of approvedCommissions.data) {
          if (remainingAmount <= 0) break;
          commissionIds.push(commission._id);
          remainingAmount -= commission.commissionAmount;
        }
      }

      await affiliatesApi.requestWithdrawal({
        amount: parseFloat(amount),
        currency: 'AED',
        paymentMethod,
        paymentDetails,
        commissionIds,
      });

      toast({
        title: 'Withdrawal Request Submitted',
        description: 'Your withdrawal request has been submitted and is pending admin approval.',
      });

      // Refresh dashboard and commissions
      queryClient.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-approved'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.response?.data?.message || 'Unable to submit withdrawal request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Request Withdrawal
          </DialogTitle>
          <DialogDescription>
            Withdraw your approved commissions. Available balance: {formatCurrency(availableBalance)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (AED)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={availableBalance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting || availableBalance === 0}
              required
            />
            <p className="text-sm text-muted-foreground">
              Available: {formatCurrency(availableBalance)}
            </p>
            {availableBalance > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(availableBalance.toString())}
              >
                Withdraw All
              </Button>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Details based on method */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <h3 className="font-semibold">Bank Transfer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={paymentDetails.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={paymentDetails.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={paymentDetails.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={paymentDetails.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={paymentDetails.swiftCode}
                    onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="space-y-2 border p-4 rounded-lg">
              <Label htmlFor="paypalEmail">PayPal Email *</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your.email@example.com"
                value={paymentDetails.paypalEmail}
                onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          {paymentMethod === 'stripe' && (
            <div className="space-y-2 border p-4 rounded-lg">
              <Label htmlFor="stripeAccountId">Stripe Account ID *</Label>
              <Input
                id="stripeAccountId"
                placeholder="acct_xxxxx"
                value={paymentDetails.stripeAccountId}
                onChange={(e) => handleInputChange('stripeAccountId', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          {paymentMethod === 'other' && (
            <div className="space-y-2 border p-4 rounded-lg">
              <Label htmlFor="otherDetails">Payment Details *</Label>
              <Textarea
                id="otherDetails"
                placeholder="Provide your payment details..."
                value={paymentDetails.otherDetails}
                onChange={(e) => handleInputChange('otherDetails', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || availableBalance === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Withdrawal
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

