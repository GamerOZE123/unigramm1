
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HolidayEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  organizer_id: string;
  max_attendees: number;
  current_attendees: number;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export default function HolidayPage() {
  const [events, setEvents] = useState<HolidayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('holiday_events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        const userIds = [...new Set(eventsData.map(event => event.organizer_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const eventsWithProfiles = eventsData.map(event => ({
          ...event,
          profiles: profilesMap.get(event.organizer_id)
        }));

        setEvents(eventsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching holiday events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading holiday events...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="post-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Holiday Events</h2>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
        <p className="text-muted-foreground">Discover and join holiday celebrations and events on campus.</p>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="post-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative h-48 bg-surface rounded-lg mb-4 overflow-hidden">
                <img
                  src={event.image_url || '/placeholder.svg'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                  {new Date(event.date).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">{event.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {event.current_attendees}/{event.max_attendees || '∞'} attending
                  </div>
                  <Button size="sm">RSVP</Button>
                </div>

                {event.profiles && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <img
                      src={event.profiles.avatar_url || '/placeholder.svg'}
                      alt={event.profiles.full_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs text-muted-foreground">
                      Organized by {event.profiles.full_name || event.profiles.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="post-card text-center py-12">
          <p className="text-muted-foreground">No upcoming holiday events.</p>
          <Button className="mt-4">
            Create the first event!
          </Button>
        </div>
      )}
    </div>
  );
}
