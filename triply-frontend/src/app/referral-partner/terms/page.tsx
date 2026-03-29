'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReferralPartnerTermsAgreement } from '@/components/referral/ReferralPartnerTermsAgreement';

export default function ReferralPartnerTermsPage() {
  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4 pt-24">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/referral-partner"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <ReferralPartnerTermsAgreement variant="page" />
      </div>
    </div>
  );
}
