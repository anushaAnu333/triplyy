'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={destination.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'}
          alt={destination.name?.en || 'Destination'}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 gradient-card" />
        
        {/* Price badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="text-sm font-semibold text-black">
            From {formatCurrency(destination.depositAmount, destination.currency)}
          </span>
        </div>

        {/* Country tag */}
        <div className="absolute bottom-4 left-4 flex items-center text-white">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{destination.country}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-brand-orange transition-colors">
          {destination.name?.en || 'Destination'}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {destination.shortDescription?.en || destination.description?.en || ''}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 font-medium">
            <Clock className="w-4 h-4 mr-1" />
            <span>{destination.duration?.days || 0} Days / {destination.duration?.nights || 0} Nights</span>
          </div>

          <Button variant="ghost" size="sm" className="group-hover:text-brand-orange font-medium" asChild>
            <Link href={`/destinations/${destination.slug}`}>
              View Details
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
