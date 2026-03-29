'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { affiliatesApi, REFERRAL_PARTNER_TERMS_VERSION } from '@/lib/api/affiliates';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export interface ReferralPartnerTermsAgreementProps {
  onSuccess?: () => void;
  onDecline?: () => void;
  variant?: 'page' | 'dialog';
}

export function ReferralPartnerTermsAgreement({
  onSuccess,
  onDecline,
  variant = 'page',
}: ReferralPartnerTermsAgreementProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsText, setTermsText] = useState<string>('');
  const [termsVersion, setTermsVersion] = useState(REFERRAL_PARTNER_TERMS_VERSION);
  const [termsLoading, setTermsLoading] = useState(true);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    affiliatesApi
      .getReferralPartnerTerms()
      .then((data) => {
        if (cancelled) return;
        setTermsText(data.content);
        setTermsVersion(data.version || REFERRAL_PARTNER_TERMS_VERSION);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            title: 'Could not load terms',
            description: 'Check your connection and try again.',
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const checkScrollBottom = useCallback(() => {
    const el = termsScrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setHasScrolledToBottom(atBottom);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkScrollBottom(), 150);
    return () => clearTimeout(t);
  }, [termsText, checkScrollBottom]);

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
      return;
    }
    router.push('/referral-partner');
  };

  const handleAgree = async () => {
    if (!termsAgreed || !hasScrolledToBottom) return;
    setIsSubmitting(true);
    try {
      await affiliatesApi.acceptReferralPartnerTerms(termsVersion);
      await refreshUser();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/referral-partner/onboarding');
      }
    } catch (error) {
      let description = 'Check that you are logged in and try again.';
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
            ? String((error.response.data as { message?: string }).message)
            : undefined;
        if (msg) description = msg;
      }
      toast({
        title: 'Could not save acceptance',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className={cn(
        'max-w-2xl mx-auto',
        variant === 'dialog' && 'border-0 shadow-none max-w-none gap-0 p-0'
      )}
    >
      {variant === 'page' && (
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-xl font-display">TR✨PLY Referral Partner Program</CardTitle>
          <CardDescription>Terms &amp; Conditions</CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn('space-y-6 pt-2', variant === 'dialog' && 'p-0 space-y-6')}>
        <div className="space-y-3">
          {termsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div
              ref={termsScrollRef}
              onScroll={checkScrollBottom}
              className={cn(
                'overflow-y-auto rounded-xl border border-border/80 bg-muted/30 px-4 py-5 sm:px-6 sm:py-6',
                'text-sm text-foreground/90 whitespace-pre-line leading-[1.65] tracking-[0.01em]',
                'shadow-inner',
                'min-h-[240px]',
                variant === 'page' ? 'max-h-[420px]' : 'max-h-[min(52vh,520px)]'
              )}
            >
              {termsText}
            </div>
          )}
          <p
            className={cn(
              'text-xs text-muted-foreground',
              hasScrolledToBottom && 'text-emerald-700 dark:text-emerald-400'
            )}
          >
            {hasScrolledToBottom
              ? 'You have read all terms. You may now agree.'
              : 'Scroll through all terms above before agreeing'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 sm:p-5 shadow-sm">
          <div className="flex gap-4 items-start">
            <Checkbox
              id="referral-terms-agree"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-1.5 h-4 w-4 flex-shrink-0 cursor-pointer"
            />
            <label
              htmlFor="referral-terms-agree"
              className="text-sm leading-relaxed text-foreground cursor-pointer select-none"
            >
              I have read and agree to the TR✨PLY Referral Partner Terms &amp; Conditions. I understand this serves as a
              binding agreement.
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter
        className={cn(
          'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center pt-5 mt-2 border-t border-border/70',
          variant === 'dialog' && 'px-0 pb-0'
        )}
      >
        <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
          Decline
        </Button>
        <Button
          onClick={handleAgree}
          disabled={!termsAgreed || !hasScrolledToBottom || isSubmitting || termsLoading}
          className="w-full sm:w-auto min-w-[200px] bg-brand-orange text-white hover:bg-brand-orange/90 border-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'I Agree & Continue'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
