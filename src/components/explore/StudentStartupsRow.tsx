import React, { useEffect, useState } from 'react';
import { Rocket, ExternalLink, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface StudentStartup {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  university?: string;
  bio?: string;
  website_url?: string;
  linkedin_url?: string;
}

export default function StudentStartupsRow() {
  const [startups, setStartups] = useState<StudentStartup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStartups();
  }, []);

  const fetchStudentStartups = async () => {
    try {
      // Look for profiles with startup-related keywords in bio or with website URLs
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, university, bio, website_url, linkedin_url')
        .eq('user_type', 'student')
        .not('website_url', 'is', null)
        .limit(10);

      if (error) throw error;
      setStartups(data || []);
    } catch (error) {
      console.error('Error fetching student startups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Student Startups</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-[280px] h-[180px] shrink-0 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (startups.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Student Startups</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {startups.map((startup) => (
            <Card key={startup.user_id} className="w-[280px] shrink-0 p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={startup.avatar_url} />
                    <AvatarFallback>{startup.full_name?.[0] || startup.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{startup.full_name || startup.username}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{startup.university}</p>
                  </div>
                </div>

                {startup.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{startup.bio}</p>
                )}

                <div className="flex gap-2">
                  {startup.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 flex-1"
                      onClick={() => window.open(startup.website_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </Button>
                  )}
                  {startup.linkedin_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 flex-1"
                      onClick={() => window.open(startup.linkedin_url, '_blank')}
                    >
                      <Users className="w-3 h-3" />
                      LinkedIn
                    </Button>
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
