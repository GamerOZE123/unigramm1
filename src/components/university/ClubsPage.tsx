import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, Globe, Search, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ClubUpcomingEvents from './ClubUpcomingEvents';
import { Input } from '@/components/ui/input';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownClub, setOwnClub] = useState<ClubProfile | null>(null);
  const [myClubs, setMyClubs] = useState<ClubProfile[]>([]);
  const [otherClubs, setOtherClubs] = useState<ClubProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const fetchClubs = async () => {
    if (!user) return;
    
    try {
      // Get logged-in user's university and user_type
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('university, user_type')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get clubs from the same university
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs_profiles')
        .select('*')
        .eq('university', profileData?.university || '')
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

        // If user is a club, separate their own club from others
        if (profileData?.user_type === 'clubs') {
          const own = clubsWithProfiles.find(club => club.user_id === user.id);
          const others = clubsWithProfiles.filter(club => club.user_id !== user.id);
          setOwnClub(own || null);
          setOtherClubs(others);
          setIsClubOwner(true);
          setIsStudent(false);
        } else {
          // For students, separate joined clubs from others
          const { data: memberships } = await supabase
            .from('club_memberships')
            .select('club_id')
            .eq('user_id', user.id);
          
          const joinedClubIds = new Set(memberships?.map(m => m.club_id) || []);
          const joined = clubsWithProfiles.filter(club => joinedClubIds.has(club.id));
          const others = clubsWithProfiles.filter(club => !joinedClubIds.has(club.id));
          
          setOwnClub(null);
          setMyClubs(joined);
          setOtherClubs(others);
          setIsClubOwner(false);
          setIsStudent(true);
        }
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clubs based on search
  const filterClubs = (clubs: ClubProfile[]) => {
    if (!searchQuery.trim()) return clubs;
    const query = searchQuery.toLowerCase();
    return clubs.filter(club => 
      club.club_name.toLowerCase().includes(query) ||
      club.category?.toLowerCase().includes(query) ||
      club.club_description?.toLowerCase().includes(query)
    );
  };

  const filteredMyClubs = filterClubs(myClubs);
  const filteredOtherClubs = filterClubs(otherClubs);

  const ClubCard = ({ club, isOwn = false }: { club: ClubProfile; isOwn?: boolean }) => (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden ${isOwn ? 'ring-2 ring-primary' : ''}`}
      onClick={() => navigate(`/clubs/${club.id}`)}
    >
      {/* Club Image */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
        {club.logo_url ? (
          <img 
            src={club.logo_url} 
            alt={club.club_name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {isOwn && (
          <Badge className="absolute top-2 right-2 bg-primary">Your Club</Badge>
        )}
        {club.category && (
          <Badge variant="secondary" className="absolute bottom-2 left-2">
            {club.category}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {club.club_name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {club.club_description || 'No description available'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{club.member_count || 0} members</span>
          </div>
          
          <div className="flex items-center gap-2">
            {club.contact_email && (
              <Mail className="w-4 h-4 text-muted-foreground" />
            )}
            {club.website_url && (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {/* Search Bar with Back Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/university')}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs by name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !ownClub && myClubs.length === 0 && otherClubs.length === 0 ? (
          <div className="text-center py-12 space-y-4 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No clubs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Club organizations can sign up to showcase their activities
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Own Club Section (for club users) */}
            {ownClub && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Your Club
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ClubCard club={ownClub} isOwn />
                </div>
              </section>
            )}

            {/* Student's Joined Clubs Section */}
            {isStudent && filteredMyClubs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  My Clubs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMyClubs.map((club) => (
                    <ClubCard key={club.id} club={club} isOwn />
                  ))}
                </div>
              </section>
            )}

            {/* Other Clubs Section */}
            {filteredOtherClubs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-muted-foreground rounded-full" />
                  {(ownClub || (isStudent && myClubs.length > 0)) ? 'Discover More Clubs' : 'All Clubs'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredOtherClubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              </section>
            )}

            {/* No results from search */}
            {searchQuery && filteredMyClubs.length === 0 && filteredOtherClubs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No clubs found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar - Show upcoming events */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 space-y-4">
          <ClubUpcomingEvents limit={3} showClubInfo={true} />
        </div>
      </aside>
    </div>
  );
}
