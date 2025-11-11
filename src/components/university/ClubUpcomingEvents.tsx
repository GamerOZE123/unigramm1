import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, MapPin, Clock, Loader2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditClubEventModal from './EditClubEventModal';

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  max_attendees: number | null;
  current_attendees: number;
  club_id: string;
  clubs_profiles?: {
    logo_url: string | null;
    club_name: string;
  };
}

interface ClubUpcomingEventsProps {
  clubId?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isOwner?: boolean; // Deprecated: use canCreate, canEdit, canDelete
  limit?: number;
  showClubInfo?: boolean;
  horizontal?: boolean;
}

export default function ClubUpcomingEvents({ 
  clubId, 
  canCreate = false,
  canEdit = false,
  canDelete = false,
  isOwner = false, // Deprecated
  limit, 
  showClubInfo = false,
  horizontal = false 
}: ClubUpcomingEventsProps) {
  // Support legacy isOwner prop
  const hasCreatePermission = canCreate || isOwner;
  const hasEditPermission = canEdit || isOwner;
  const hasDeletePermission = canDelete || isOwner;
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    max_attendees: ''
  });

  useEffect(() => {
    if (clubId) {
      fetchEvents();
    }
  }, [clubId]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('club_events')
        .select('*, clubs_profiles(logo_url, club_name)')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!clubId || !newEvent.title || !newEvent.event_date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('club_events')
        .insert({
          club_id: clubId,
          title: newEvent.title,
          description: newEvent.description || null,
          event_date: newEvent.event_date,
          event_time: newEvent.event_time || null,
          location: newEvent.location || null,
          max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        max_attendees: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasCreatePermission && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="event_time">Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={newEvent.event_time}
                    onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={newEvent.max_attendees}
                  onChange={(e) => setNewEvent({ ...newEvent, max_attendees: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <Button onClick={handleCreateEvent} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No upcoming events
          </p>
        </div>
      ) : (
        <div className={horizontal ? "flex gap-3 overflow-x-auto pb-2" : "space-y-3"}>
          {events.map((event) => (
            <div key={event.id} className={`p-4 border rounded-lg space-y-2 ${horizontal ? 'min-w-[300px]' : ''}`}>
              <div className="flex items-start gap-3">
                {showClubInfo && event.clubs_profiles && (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={event.clubs_profiles.logo_url || ''} />
                    <AvatarFallback>
                      {event.clubs_profiles.club_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    {hasEditPermission && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {showClubInfo && event.clubs_profiles && (
                    <p className="text-xs text-primary mb-1">{event.clubs_profiles.club_name}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(event.event_date), 'MMM dd, yyyy')}</span>
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{event.event_time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditClubEventModal
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          event={editingEvent}
          onSuccess={fetchEvents}
          canDelete={hasDeletePermission}
        />
      )}
    </div>
  );
}
