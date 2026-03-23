'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { TripPackage } from '@/lib/api/packages';
import { formatCurrency } from '@/lib/utils';

interface PackageCardProps {
  pkg: TripPackage;
  /** Keep API same as DestinationCard for consistent usage */
  variant?: 'full' | 'compact';
  ctaText?: string;
}

export function PackageCard({ pkg, variant = 'full', ctaText = 'View' }: PackageCardProps) {
  const img = pkg.thumbnailImage || pkg.images?.[0] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800';
  const currency = pkg.priceCurrency || pkg.pricingTable?.currency || 'AED';
  const minFromTable =
    pkg.pricingTable?.rows?.length
      ? Math.min(
          ...pkg.pricingTable.rows.flatMap((r) => r.values).filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
        )
      : null;
  const priceBadge =
    typeof minFromTable === 'number' && Number.isFinite(minFromTable)
      ? `From ${formatCurrency(minFromTable, currency)}`
      : pkg.priceLabel?.trim() || 'View details';

  return (
    <Link href={`/packages/${pkg.slug}`} className="block h-full">
      <Card className="overflow-hidden rounded-2xl border border-slate-100 shadow-md h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={img}
            alt={pkg.name || 'Package'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span />
            <span className="inline-flex px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-sm font-bold text-slate-800 shadow-md">
              {priceBadge}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 z-10">
            <div className="flex items-center gap-1.5 text-white/90 text-sm mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{pkg.location}</span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight drop-shadow-sm pr-4 line-clamp-2 mb-3">
              {pkg.name || 'Package'}
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-white/90">
                {pkg.duration ? (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-white/80" />
                    {pkg.duration.days}D / {pkg.duration.nights}N
                  </span>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-1 text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {variant === 'compact' ? 'Explore' : ctaText}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
