import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  max_attendees: number | null;
}

interface EditClubEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ClubEvent;
  onSuccess: () => void;
  canDelete?: boolean;
}

export default function EditClubEventModal({ open, onOpenChange, event, onSuccess, canDelete = true }: EditClubEventModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    event_date: event.event_date,
    event_time: event.event_time || '',
    location: event.location || '',
    max_attendees: event.max_attendees?.toString() || ''
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.event_date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('club_events')
        .update({
          title: formData.title,
          description: formData.description || null,
          event_date: formData.event_date,
          event_time: formData.event_time || null,
          location: formData.location || null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully"
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('club_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event_time">Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location"
            />
          </div>
          <div>
            <Label htmlFor="max_attendees">Max Attendees</Label>
            <Input
              id="max_attendees"
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            {canDelete && (
              <Button onClick={handleDelete} disabled={loading} variant="destructive">
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}