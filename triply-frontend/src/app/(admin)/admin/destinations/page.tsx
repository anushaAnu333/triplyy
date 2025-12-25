'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api/axios';

export default function AdminDestinationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    country: '',
    region: '',
    depositAmount: 199,
    durationDays: 1,
    durationNights: 1,
    thumbnailImage: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-destinations', page, search],
    queryFn: () => destinationsApi.getAll({ page, limit: 10, search }),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/destinations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination created successfully' });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create destination', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/destinations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination updated successfully' });
      setEditingDestination(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update destination', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/destinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete destination', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      country: '',
      region: '',
      depositAmount: 199,
      durationDays: 1,
      durationNights: 1,
      thumbnailImage: '',
    });
  };

  const handleEdit = (destination: Destination) => {
    setFormData({
      nameEn: destination.name.en,
      nameAr: destination.name.ar || '',
      descriptionEn: destination.description.en,
      country: destination.country,
      region: destination.region || '',
      depositAmount: destination.depositAmount,
      durationDays: destination.duration.days,
      durationNights: destination.duration.nights,
      thumbnailImage: destination.thumbnailImage || '',
    });
    setEditingDestination(destination);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: { en: formData.nameEn, ar: formData.nameAr },
      description: { en: formData.descriptionEn },
      country: formData.country,
      region: formData.region,
      depositAmount: formData.depositAmount,
      duration: { days: formData.durationDays, nights: formData.durationNights },
      thumbnailImage: formData.thumbnailImage,
    };

    if (editingDestination) {
      updateMutation.mutate({ id: editingDestination._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this destination?')) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Manage Destinations</h1>
            <p className="text-muted-foreground">Add and manage travel destinations</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Destination
            </Button>
          </div>
        </div>

        {/* Destinations Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No destinations yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by adding your first travel destination
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Destination
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map((destination: Destination) => (
              <Card key={destination._id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  {destination.thumbnailImage ? (
                    <img
                      src={destination.thumbnailImage}
                      alt={destination.name.en}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                    destination.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {destination.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display text-xl font-semibold mb-1">
                    {destination.name.en}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {destination.country} • {destination.duration.days} days
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                      {formatCurrency(destination.depositAmount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(destination)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDelete(destination._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingDestination} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingDestination(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDestination ? 'Edit Destination' : 'Add New Destination'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the travel destination
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (English)</Label>
              <textarea
                className="w-full p-3 border rounded-lg min-h-[100px]"
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Deposit Amount (AED)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nights</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.durationNights}
                  onChange={(e) => setFormData({ ...formData, durationNights: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Image URL</Label>
              <Input
                type="url"
                value={formData.thumbnailImage}
                onChange={(e) => setFormData({ ...formData, thumbnailImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingDestination(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {editingDestination ? 'Update' : 'Create'} Destination
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

