'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { activitiesApi, Activity } from '@/lib/api/activities';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';
import { useRouter } from 'next/navigation';
import {
  SearchFiltersModal,
  SearchFiltersStickyBar,
  countActiveFilters,
} from '@/components/filters';

export default function ActivitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['activities', search, location],
    queryFn: () =>
      activitiesApi.getAll({
        page: 1,
        limit: 12,
        search: search.trim() || undefined,
        location: location.trim() || undefined,
      }),
  });

  const handleBookNow = (activity: Activity) => {
    setSelectedActivity(activity);
    setBookingModalOpen(true);
  };

  const activeFilterCount = useMemo(
    () => countActiveFilters([Boolean(search.trim()), Boolean(location.trim())]),
    [search, location]
  );

  const clearAllFilters = () => {
    setSearch('');
    setLocation('');
  };

  return (
    <div className="min-h-screen bg-muted/30 py-6 pb-10">
      <SearchFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Search & filters"
        description="Search activities by keyword and filter by location."
        fields={[
          {
            id: 'act-search',
            label: 'Search',
            value: search,
            onChange: setSearch,
            placeholder: 'Search activities…',
          },
          {
            id: 'act-location',
            label: 'Location',
            value: location,
            onChange: setLocation,
            placeholder: 'City or area…',
            icon: <MapPin className="h-4 w-4" aria-hidden />,
          },
        ]}
        onClearAll={clearAllFilters}
      />

      <SearchFiltersStickyBar
        title="Activities"
        onOpenFilters={() => setFilterModalOpen(true)}
        activeCount={activeFilterCount}
      />

      <div className="container mx-auto px-4">
        <p className="mb-6 text-muted-foreground">Discover amazing activities and experiences</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">No activities found</p>
              <Button variant="outline" onClick={() => setFilterModalOpen(true)}>
                Adjust search & filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((activity) => (
              <Card
                key={activity._id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/activities/${activity._id}`)}
              >
                <div className="relative h-48">
                  <img
                    src={activity.photos[0] || '/placeholder-activity.jpg'}
                    alt={activity.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{activity.title}</h3>
                  <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {activity.location}
                  </p>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">
                      {activity.currency} {activity.price}
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(activity);
                      }}
                      size="sm"
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedActivity ? (
          <ActivityBookingModal
            activity={selectedActivity}
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedActivity(null);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
