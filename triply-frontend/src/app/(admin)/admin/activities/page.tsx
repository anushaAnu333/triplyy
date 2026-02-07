'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { adminActivitiesApi, Activity } from '@/lib/api/activities';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminActivitiesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activities', activeTab],
    queryFn: () => adminActivitiesApi.getAll(activeTab),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminActivitiesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
      toast({
        title: 'Activity approved',
        description: 'The activity has been approved and is now visible to customers.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve activity',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminActivitiesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedActivity(null);
      toast({
        title: 'Activity rejected',
        description: 'The activity has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject activity',
        variant: 'destructive',
      });
    },
  });

  const handleReject = (activity: Activity) => {
    setSelectedActivity(activity);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedActivity || !rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    rejectMutation.mutate({ id: selectedActivity._id, reason: rejectionReason });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Activities Management</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage submitted activities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'approved')}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activities || activities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending activities</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => {
                  const isExpanded = expandedActivity === activity._id;
                  return (
                    <Card key={activity._id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          {activity.photos[0] && (
                            <div className="flex-shrink-0">
                              <img
                                src={activity.photos[0]}
                                alt={activity.title}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            </div>
                          )}

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-0.5">{activity.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                  By {activity.merchantId.firstName} {activity.merchantId.lastName}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">Pending</Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-2 text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{activity.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">
                                  {activity.currency} {activity.price.toLocaleString()}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {activity.photos.length} photo{activity.photos.length > 1 ? 's' : ''}
                              </span>
                            </div>

                            <p className={`text-xs text-muted-foreground mb-2 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                              {activity.description}
                            </p>

                            {/* Expandable Details */}
                            {isExpanded && (
                              <div className="mb-2 space-y-2 pt-2 border-t">
                                {/* All Photos */}
                                {activity.photos.length > 1 && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {activity.photos.slice(1).map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo}
                                        alt={`${activity.title} ${index + 2}`}
                                        className="w-full h-16 object-cover rounded-md"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedActivity(isExpanded ? null : activity._id)}
                                className="h-7 text-xs"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="mr-1 h-3 w-3" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="mr-1 h-3 w-3" />
                                    Show More
                                  </>
                                )}
                              </Button>

                              <Button
                                onClick={() => approveMutation.mutate(activity._id)}
                                disabled={approveMutation.isPending}
                                size="sm"
                                className="h-7 text-xs"
                              >
                                {approveMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleReject(activity)}
                                variant="destructive"
                                disabled={rejectMutation.isPending}
                                size="sm"
                                className="h-7 text-xs"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activities || activities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved activities</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => {
                  const isExpanded = expandedActivity === activity._id;
                  return (
                    <Card key={activity._id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          {activity.photos[0] && (
                            <div className="flex-shrink-0">
                              <img
                                src={activity.photos[0]}
                                alt={activity.title}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            </div>
                          )}

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-0.5">{activity.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                  By {activity.merchantId.firstName} {activity.merchantId.lastName}
                                </p>
                              </div>
                              <Badge className="bg-green-500 ml-2 text-xs">Approved</Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-2 text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{activity.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">
                                  {activity.currency} {activity.price.toLocaleString()}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {activity.photos.length} photo{activity.photos.length > 1 ? 's' : ''}
                              </span>
                            </div>

                            <p className={`text-xs text-muted-foreground mb-2 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                              {activity.description}
                            </p>

                            {/* Expandable Details */}
                            {isExpanded && (
                              <div className="mb-2 space-y-2 pt-2 border-t">
                                {/* All Photos */}
                                {activity.photos.length > 1 && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {activity.photos.slice(1).map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo}
                                        alt={`${activity.title} ${index + 2}`}
                                        className="w-full h-16 object-cover rounded-md"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedActivity(isExpanded ? null : activity._id)}
                                className="h-7 text-xs"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="mr-1 h-3 w-3" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="mr-1 h-3 w-3" />
                                    Show More
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Activity</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this activity. The merchant will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                variant="destructive"
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Activity'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
