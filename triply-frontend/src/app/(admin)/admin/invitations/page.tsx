'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/lib/api/axios';

interface Invitation {
  _id: string;
  email: string;
  role: 'admin' | 'affiliate';
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export default function AdminInvitationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'affiliate'>('affiliate');

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const response = await api.get('/admin/invitations');
      return response.data.data as Invitation[];
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; role: 'admin' | 'affiliate' }) => {
      const response = await api.post('/admin/invitations', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: 'Invitation sent!',
        description: 'An invitation email has been sent to the user.',
      });
      setIsDialogOpen(false);
      setEmail('');
      setRole('affiliate');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send invitation',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;
    createInvitationMutation.mutate({ email, role });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground mt-1">
              Invite new admins or affiliates to join the platform
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Send Invitation</DialogTitle>
                  <DialogDescription>
                    Send an invitation email to a new admin or affiliate
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: 'admin' | 'affiliate') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createInvitationMutation.isPending}>
                    {createInvitationMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid gap-4">
            {invitations && invitations.length > 0 ? (
              invitations.map((invitation) => (
                <Card key={invitation._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{invitation.email}</CardTitle>
                          <CardDescription>
                            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invitation.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : invitation.status === 'expired'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>Sent on: {new Date(invitation.createdAt).toLocaleDateString()}</p>
                      {invitation.expiresAt && (
                        <p>Expires on: {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by sending an invitation to a new admin or affiliate
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Send First Invitation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
