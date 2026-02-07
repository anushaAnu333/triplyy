'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { activitiesApi, Activity } from '@/lib/api/activities';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';
import Link from 'next/link';

export default function ActivitiesPage() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['activities', search, location],
    queryFn: () =>
      activitiesApi.getAll({
        page: 1,
        limit: 12,
        search: search || undefined,
        location: location || undefined,
      }),
  });

  const handleBookNow = (activity: Activity) => {
    setSelectedActivity(activity);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Activities</h1>
          <p className="text-muted-foreground">
            Discover amazing activities and experiences
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Activities Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No activities found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((activity) => (
              <Card key={activity._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img
                    src={activity.photos[0] || '/placeholder-activity.jpg'}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activity.location}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">
                      {activity.currency} {activity.price}
                    </p>
                    <Button onClick={() => handleBookNow(activity)} size="sm">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedActivity && (
          <ActivityBookingModal
            activity={selectedActivity}
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedActivity(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
