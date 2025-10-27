import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Phone, Globe } from 'lucide-react';

interface ClubProfile {
  id: string;
  user_id: string;
  club_name: string;
  club_description: string;
  logo_url: string;
  category: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  university: string;
  member_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      // First, get clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;

      if (clubsData && clubsData.length > 0) {
        // Then get profiles for those clubs
        const userIds = clubsData.map(club => club.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Map profiles to clubs
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const clubsWithProfiles = clubsData.map(club => ({
          ...club,
          profiles: profilesMap.get(club.user_id) || null
        }));

        setClubs(clubsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">University Clubs & Organizations</h1>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading clubs...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Users className="w-16 h-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No clubs found yet</p>
          <p className="text-sm text-muted-foreground">Club organizations can sign up to showcase their activities</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <Card key={club.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                {club.logo_url && (
                  <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
                    <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardTitle>{club.club_name}</CardTitle>
                {club.category && <CardDescription>{club.category}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{club.club_description}</p>
                
                <div className="space-y-2 pt-2">
                  {club.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${club.contact_email}`} className="text-primary hover:underline">
                        {club.contact_email}
                      </a>
                    </div>
                  )}
                  {club.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{club.contact_phone}</span>
                    </div>
                  )}
                  {club.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={club.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Users className="w-4 h-4" />
                  <span>{club.member_count} members</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
