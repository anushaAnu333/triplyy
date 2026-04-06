'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getPackageEnquiryConfig } from '@/lib/packageEnquiry';
import { cn } from '@/lib/utils';

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Dial codes for the selector (GCC + common expat markets). */
const DIAL_OPTIONS = [
  { value: '971', label: '🇦🇪 +971', region: 'UAE' },
  { value: '91', label: '🇮🇳 +91', region: 'India' },
  { value: '966', label: '🇸🇦 +966', region: 'Saudi Arabia' },
  { value: '974', label: '🇶🇦 +974', region: 'Qatar' },
  { value: '965', label: '🇰🇼 +965', region: 'Kuwait' },
  { value: '968', label: '🇴🇲 +968', region: 'Oman' },
  { value: '973', label: '🇧🇭 +973', region: 'Bahrain' },
  { value: '92', label: '🇵🇰 +92', region: 'Pakistan' },
  { value: '44', label: '🇬🇧 +44', region: 'UK' },
  { value: '1', label: '🇺🇸 +1', region: 'US / Canada' },
] as const;

function normalizeUaeLocal(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (!d.length) return null;
  let local = d;
  if (local.startsWith('971')) local = local.slice(3);
  if (local.startsWith('0')) local = local.slice(1);
  if (/^5[0-9]{8}$/.test(local)) return local;
  return null;
}

function normalizeIndianLocal(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (!d.length) return null;
  let local = d;
  if (local.startsWith('91')) local = local.slice(2);
  if (local.startsWith('0')) local = local.slice(1);
  if (/^[6-9][0-9]{9}$/.test(local)) return local;
  return null;
}

/**
 * Returns E.164 without leading +, or null with an error hint for the selected dial code.
 */
function normalizeToE164(
  dialCode: string,
  raw: string
): { e164: string } | { error: string } {
  const digits = raw.replace(/\D/g, '');
  if (!digits.length) {
    return { error: 'Phone number is required' };
  }

  if (dialCode === '971') {
    const local = normalizeUaeLocal(raw);
    if (!local) {
      return { error: 'Enter a valid UAE mobile (e.g. 050 123 4567)' };
    }
    return { e164: `971${local}` };
  }

  if (dialCode === '91') {
    const local = normalizeIndianLocal(raw);
    if (!local) {
      return { error: 'Enter a valid Indian mobile (10 digits, e.g. 98765 43210)' };
    }
    return { e164: `91${local}` };
  }

  let n = digits;
  if (n.startsWith(dialCode)) {
    n = n.slice(dialCode.length);
  }
  if (n.startsWith('0')) {
    n = n.slice(1);
  }
  if (n.length >= 8 && n.length <= 12 && /^[0-9]+$/.test(n)) {
    return { e164: `${dialCode}${n}` };
  }
  return {
    error: 'Enter a valid number for the country you selected',
  };
}

const callbackSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email'),
  dialCode: z.string().min(1, 'Select a country code'),
  phone: z.string().min(1, 'Phone number is required'),
});

type CallbackFormData = z.infer<typeof callbackSchema>;

export function FloatingWhatsAppCallback() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdminPage = pathname?.startsWith('/admin');
  const isAffiliatePage = pathname?.startsWith('/affiliate');
  const hideOnThisRoute = isAdminPage || isAffiliatePage;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<CallbackFormData>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { fullName: '', email: '', dialCode: '971', phone: '' },
  });

  const dialCode = watch('dialCode');
  const phonePlaceholder =
    dialCode === '971'
      ? '050 123 4567'
      : dialCode === '91'
        ? '98765 43210'
        : 'Mobile number';

  useEffect(() => {
    if (hideOnThisRoute) setOpen(false);
  }, [hideOnThisRoute]);

  const onSubmit = (data: CallbackFormData) => {
    const parsed = normalizeToE164(data.dialCode, data.phone);
    if ('error' in parsed) {
      setError('phone', { message: parsed.error });
      return;
    }
    const { e164 } = parsed;

    setSubmitting(true);
    try {
      const { whatsappHref } = getPackageEnquiryConfig();
      const base = whatsappHref.split('?')[0];
      const text = [
        'Hi TR✨PLY — please call me back.',
        '',
        `Name: ${data.fullName}`,
        `Email: ${data.email}`,
        `Phone: +${e164}`,
      ].join('\n');
      const url = `${base}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({
        title: 'Opening WhatsApp',
        description: 'Send the message and our team will call you back.',
      });
      reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (hideOnThisRoute) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-5 right-5 z-[45] transition-opacity duration-200 md:bottom-6 md:right-6',
          open && 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          aria-label="Request a callback on WhatsApp"
        >
          <span
            className="absolute inset-0 scale-150 rounded-full bg-black/35 blur-md transition-opacity group-hover:bg-black/45"
            aria-hidden
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition-transform group-hover:scale-105">
            <WhatsAppGlyph className="h-8 w-8" />
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'max-w-[420px] gap-0 border-0 bg-transparent p-6 shadow-none sm:rounded-2xl',
            '[&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
          )}
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement;
            if (
              t.closest('[data-radix-select-viewport]') ||
              t.closest('[data-radix-popper-content-wrapper]') ||
              t.closest('[role="listbox"]')
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">Request a callback</DialogTitle>
          <p className="mb-4 text-center text-base font-medium leading-snug text-white sm:text-lg">
            Leave your number below and we will call you right away!
          </p>

          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="callback-fullName">Full name (required)</Label>
                <Input
                  id="callback-fullName"
                  autoComplete="name"
                  placeholder="Your name"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="callback-email">Email (required)</Label>
                <Input
                  id="callback-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 normal-case">
                  <Phone className="h-4 w-4 text-black" aria-hidden />
                  Enter your number (The call is free)
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Controller
                    name="dialCode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className="h-10 w-full shrink-0 sm:w-[132px]"
                          aria-label="Country calling code"
                        >
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] max-h-72">
                          {DIAL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}{' '}
                              <span className="text-muted-foreground">
                                ({opt.region})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    id="callback-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder={phonePlaceholder}
                    className="min-w-0 flex-1"
                    {...register('phone')}
                  />
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 shrink-0 bg-neutral-200 font-semibold text-neutral-900 hover:bg-neutral-300 sm:px-4"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Call me!'
                    )}
                  </Button>
                </div>
                {errors.dialCode && (
                  <p className="text-sm text-destructive">{errors.dialCode.message}</p>
                )}
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
