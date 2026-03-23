'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plane } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { packagesApi } from '@/lib/api/packages';
import { PackageCard } from '@/components/packages/PackageCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getPackageEnquiryConfig } from '@/lib/packageEnquiry';

export default function PackagesPage() {
  const [search, setSearch] = useState('');
  const enquiry = getPackageEnquiryConfig();

  const { data, isLoading } = useQuery({
    queryKey: ['packages', search],
    queryFn: () => packagesApi.getAll({ search: search || undefined, limit: 50 }),
  });

  const packages = data?.data ?? [];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto px-4">
        {/* Hero — catalogue-first, similar spirit to AFC "Our Best Holiday Packages" */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange mb-4">
            <Plane className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold tracking-wider uppercase text-brand-orange mb-2">Packages</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Explore our packages</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Browse international tour-style offers. View full itineraries and pricing on each package, then{' '}
            <strong className="text-foreground font-medium">enquire</strong> by call, WhatsApp, or email — our team will assist
            you like a traditional holiday specialist.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Prefer deposit-based booking on Triply? See{' '}
            <Link href="/destinations" className="text-brand-orange hover:underline font-medium">
              Destinations
            </Link>
            .
          </p>
        </div>

        {/* Quick contact strip — AFC-style visible assistance */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
          <a href={enquiry.telHref} className="text-foreground font-medium hover:text-brand-orange">
            {enquiry.phoneDisplay}
          </a>
          <span className="text-muted-foreground hidden sm:inline">·</span>
          <a href={enquiry.mailtoHref} className="text-brand-orange hover:underline">
            {enquiry.email}
          </a>
        </div>

        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Where to? Search by name or place…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-full border-slate-200 shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground rounded-2xl border border-dashed bg-muted/30">
            <p className="mb-2">No packages listed yet.</p>
            <Button asChild variant="outline">
              <Link href="/destinations">Browse destinations</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                pkg={pkg}
                variant="full"
                ctaText="View"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
