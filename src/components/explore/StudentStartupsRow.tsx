import React, { useEffect, useState } from 'react';
import { Rocket, ExternalLink, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface StudentStartup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  looking_for?: string[];
  website_url?: string;
  contact_email?: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string;
    university?: string;
  };
}

export default function StudentStartupsRow() {
  const [startups, setStartups] = useState<StudentStartup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStartups();
  }, []);

  const fetchStudentStartups = async () => {
    try {
      const { data, error } = await supabase
        .from('student_startups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map((s: any) => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url, university')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const startupsWithProfiles = data.map((startup: any) => ({
          ...startup,
          profiles: profilesData?.find((p: any) => p.user_id === startup.user_id)
        }));

        setStartups(startupsWithProfiles || []);
      } else {
        setStartups([]);
      }
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
            <Card 
              key={startup.id} 
              className="w-[280px] shrink-0 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/startups/${startup.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={startup.profiles?.avatar_url} />
                      <AvatarFallback>
                        {startup.profiles?.full_name?.[0] || startup.profiles?.username?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm line-clamp-1">{startup.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {startup.profiles?.full_name || startup.profiles?.username}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{startup.category}</Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>

                {startup.profiles?.university && (
                  <Badge variant="outline" className="text-xs">{startup.profiles.university}</Badge>
                )}

                {startup.looking_for && startup.looking_for.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {startup.looking_for.slice(0, 2).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
