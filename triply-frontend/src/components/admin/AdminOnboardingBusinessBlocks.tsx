'use client';

import { User, Briefcase } from 'lucide-react';
import {
  KNOWN_BUSINESS_INFO_KEYS,
  renderUnknown,
  toLabel,
} from '@/lib/admin/onboardingDetailShared';

interface UserIdShape {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface AdminOnboardingBusinessBlocksProps {
  userId: UserIdShape;
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
}

/** Contact + bank / business fields — same layout as merchant onboarding admin detail */
export function AdminOnboardingBusinessBlocks({
  userId,
  businessType,
  categories,
  businessInfo: biz,
}: AdminOnboardingBusinessBlocksProps) {
  const extraBusinessEntries = Object.entries(biz).filter(([key]) => !KNOWN_BUSINESS_INFO_KEYS.has(key));

  return (
    <>
      <div>
        <h4 className="font-medium flex items-center gap-2 mb-2">
          <User className="h-4 w-4" /> Contact
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>Applicant email</span>
          <span>{userId?.email}</span>
          <span>Applicant phone</span>
          <span>{userId?.phoneNumber || '—'}</span>
          <span>Business email</span>
          <span>{(biz.email as string) || '—'}</span>
          <span>Business name</span>
          <span>{(biz.businessName as string) || '—'}</span>
          <span>Contact person</span>
          <span>{(biz.contactPerson as string) || '—'}</span>
          <span>Designation</span>
          <span>{(biz.designation as string) || '—'}</span>
          <span>Phone</span>
          <span>{(biz.phone as string) || '—'}</span>
          <span>Emirate</span>
          <span>{(biz.emirate as string) || '—'}</span>
          <span>Website</span>
          <span>
            {biz.website ? (
              <a
                href={String(biz.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {String(biz.website)}
              </a>
            ) : (
              '—'
            )}
          </span>
        </div>
        {extraBusinessEntries.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {extraBusinessEntries.map(([key, value]) => (
              <div key={key} className="contents">
                <span>{toLabel(key)}</span>
                <span className="break-words">{renderUnknown(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-medium flex items-center gap-2 mb-2">
          <Briefcase className="h-4 w-4" /> Business
        </h4>
        <p className="text-sm text-muted-foreground">
          Type: {businessType} · Categories: {categories?.join(', ') || '—'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>Bank name</span>
          <span>{(biz.bankName as string) || '—'}</span>
          <span>Account holder</span>
          <span>{(biz.accountHolderName as string) || '—'}</span>
          <span>Account number</span>
          <span className="font-mono text-xs break-all">
            {((biz.accountNumber ?? biz.iban) as string) || '—'}
          </span>
          <span>VAT / TRN</span>
          <span>{(biz.vatTrn as string) || '—'}</span>
          <span>Currency</span>
          <span>{(biz.currency as string) || '—'}</span>
        </div>
      </div>
    </>
  );
}
