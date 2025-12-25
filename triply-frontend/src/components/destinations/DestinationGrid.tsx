'use client';

import { DestinationCard } from './DestinationCard';
import { Destination } from '@/lib/api/destinations';

interface DestinationGridProps {
  destinations: Destination[];
  isLoading?: boolean;
}

export function DestinationGrid({ destinations, isLoading }: DestinationGridProps) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted h-64 rounded-t-lg" />
            <div className="bg-card p-6 rounded-b-lg space-y-4">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No destinations found.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {destinations.map((destination) => (
        <DestinationCard key={destination._id} destination={destination} />
      ))}
    </div>
  );
}

