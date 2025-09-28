
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  member_count: number;
  admin_user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .order('member_count', { ascending: false });

      if (clubsError) throw clubsError;

      if (clubsData && clubsData.length > 0) {
        const userIds = [...new Set(clubsData.map(club => club.admin_user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const clubsWithProfiles = clubsData.map(club => ({
          ...club,
          profiles: profilesMap.get(club.admin_user_id)
        }));

        setClubs(clubsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading clubs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="post-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">University Clubs</h2>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Club
          </Button>
        </div>
        <p className="text-muted-foreground">Join clubs and connect with students who share your interests.</p>
      </div>

      {/* Clubs Grid */}
      {clubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div key={club.id} className="post-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative h-40 bg-surface rounded-lg mb-4 overflow-hidden">
                <img
                  src={club.image_url || '/placeholder.svg'}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
                {club.category && (
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                    {club.category}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">{club.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{club.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {club.member_count} members
                  </div>
                  <Button size="sm">Join Club</Button>
                </div>

                {club.profiles && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <img
                      src={club.profiles.avatar_url || '/placeholder.svg'}
                      alt={club.profiles.full_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs text-muted-foreground">
                      Admin: {club.profiles.full_name || club.profiles.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="post-card text-center py-12">
          <p className="text-muted-foreground">No clubs available yet.</p>
          <Button className="mt-4">
            Create the first club!
          </Button>
        </div>
      )}
    </div>
  );
}
