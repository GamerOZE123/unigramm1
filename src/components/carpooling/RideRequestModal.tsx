import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RideRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  onRequestCreated: () => void;
}

export default function RideRequestModal({ 
  open, 
  onOpenChange, 
  rideId,
  onRequestCreated 
}: RideRequestModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request a ride",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, get the ride details to find the driver
      const { data: rideData, error: rideError } = await supabase
        .from('carpool_rides')
        .select('driver_id, from_location, to_location, ride_date')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;

      // Get passenger profile for notification
      const { data: passengerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Create the ride request
      const { error } = await supabase
        .from('carpool_ride_requests')
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          message: message || null,
          status: 'pending'
        });

      if (error) {
        // Check if it's a duplicate request
        if (error.code === '23505') {
          toast({
            title: "Already Requested",
            description: "You have already requested this ride",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Create notification for the driver
      if (rideData?.driver_id && passengerProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: rideData.driver_id,
            type: 'carpool_request',
            title: 'New Ride Request',
            message: `${passengerProfile.full_name || 'Someone'} requested to join your ride from ${rideData.from_location} to ${rideData.to_location}`,
            related_user_id: user.id
          });
      }

      toast({
        title: "Request Sent",
        description: "Your ride request has been sent to the driver!",
      });

      setMessage('');
      onRequestCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Error",
        description: "Failed to send ride request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Ride</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message to the driver..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
