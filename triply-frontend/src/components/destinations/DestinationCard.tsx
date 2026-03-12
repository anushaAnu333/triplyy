'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Star, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';

interface DestinationCardProps {
  destination: Destination;
  /** 'full' = show description (destinations page), 'compact' = no description (homepage) */
  variant?: 'full' | 'compact';
  /** CTA text, e.g. "View" or "Explore" */
  ctaText?: string;
}

export function DestinationCard({
  destination,
  variant = 'full',
  ctaText = 'View',
}: DestinationCardProps) {
  return (
    <Link href={`/destinations/${destination.slug}`} className="block h-full">
      <Card className="overflow-hidden rounded-2xl border border-slate-100 shadow-md h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={destination.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'}
            alt={destination.name || 'Destination'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />

          {/* Top row: Featured badge (left) + Price (right) */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            {destination.isFeatured ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-orange text-white text-xs font-semibold shadow-lg">
                ✨ Featured
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-sm font-bold text-slate-800 shadow-md">
              From {formatCurrency(destination.depositAmount || 199, destination.currency || 'AED')}
            </span>
          </div>

          {/* All content overlaid on image - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 z-10">
            <div className="flex items-center gap-1.5 text-white/90 text-sm mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {destination.country}
                {destination.region ? ` · ${destination.region}` : ''}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight drop-shadow-sm pr-4 line-clamp-2 mb-3">
              {destination.name || 'Destination'}
            </h3>

           
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/80" />
                  {destination.duration?.days || 0}D / {destination.duration?.nights || 0}N
                </span>
               
              </div>
              <span className="inline-flex items-center gap-1 text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
