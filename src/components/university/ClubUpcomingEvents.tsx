import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function ClubUpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No upcoming events
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check back later for club events
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
