import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface RideRequest {
  id: string;
  passenger_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profiles: {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    university: string;
  } | null;
}

interface RideRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  onRequestHandled: () => void;
}

export default function RideRequestsModal({ 
  open, 
  onOpenChange, 
  rideId,
  onRequestHandled 
}: RideRequestsModalProps) {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && rideId) {
      fetchRequests();
    }
  }, [open, rideId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('carpool_ride_requests')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (requestsData && requestsData.length > 0) {
        const passengerIds = requestsData.map(r => r.passenger_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, university')
          .in('user_id', passengerIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const requestsWithProfiles = requestsData.map(request => ({
          ...request,
          profiles: profilesMap.get(request.passenger_id) || null
        }));

        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load ride requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      // Get request details before updating
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Get ride details
      const { data: rideData } = await supabase
        .from('carpool_rides')
        .select('driver_id, from_location, to_location, ride_date')
        .eq('id', rideId)
        .single();

      // Get driver profile for notification
      const { data: driverProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', rideData?.driver_id)
        .single();

      // Update request status
      const { error } = await supabase
        .from('carpool_ride_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for the passenger
      if (request.passenger_id && rideData && driverProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.passenger_id,
            type: 'carpool_accepted',
            title: 'Ride Request Accepted',
            message: `${driverProfile.full_name || 'The driver'} accepted your ride request from ${rideData.from_location} to ${rideData.to_location}`,
            related_user_id: rideData.driver_id
          });
      }

      toast({
        title: "Success",
        description: "Ride request accepted!",
      });

      fetchRequests();
      onRequestHandled();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('carpool_ride_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ride request rejected",
      });

      fetchRequests();
      onRequestHandled();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Ride Requests</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests for this ride yet
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm font-semibold">
                      Pending ({pendingRequests.length})
                    </Badge>
                  </div>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-4 bg-card">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                          <AvatarImage src={request.profiles?.avatar_url || ''} />
                          <AvatarFallback className="text-lg font-semibold">
                            {request.profiles?.full_name?.charAt(0) || <User className="w-6 h-6" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg text-foreground mb-1">
                            {request.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm font-medium text-primary mb-1">
                            {request.profiles?.university || 'Unknown University'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {request.message && (
                        <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border-l-2 border-primary">
                          <p className="font-medium text-xs text-muted-foreground mb-1">Message:</p>
                          <p>{request.message}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accepted Requests */}
              {acceptedRequests.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-sm font-semibold">
                      Accepted ({acceptedRequests.length})
                    </Badge>
                  </div>
                  {acceptedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {request.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.university || 'Unknown University'}
                          </p>
                        </div>
                        <Badge variant="default">
                          <Check className="w-3 h-3 mr-1" />
                          Accepted
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejected Requests */}
              {rejectedRequests.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-sm font-semibold">
                      Rejected ({rejectedRequests.length})
                    </Badge>
                  </div>
                  {rejectedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {request.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.university || 'Unknown University'}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <X className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

