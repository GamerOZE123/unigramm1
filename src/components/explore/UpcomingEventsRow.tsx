import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  location?: string;
  current_attendees?: number;
  max_attendees?: number;
  clubs_profiles?: {
    club_name: string;
    logo_url?: string;
  };
}

export default function UpcomingEventsRow() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('club_events')
        .select(`
          id,
          title,
          event_date,
          event_time,
          location,
          current_attendees,
          max_attendees,
          clubs_profiles (
            club_name,
            logo_url
          )
        `)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Upcoming Events</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-[300px] h-[140px] shrink-0 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Upcoming Events</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {events.map((event) => (
            <Card key={event.id} className="w-[300px] shrink-0 p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2 mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.clubs_profiles?.club_name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(event.event_date), 'MMM dd, yyyy')}</span>
                    {event.event_time && <span>• {event.event_time}</span>}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  {event.max_attendees && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {event.current_attendees || 0}/{event.max_attendees}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
