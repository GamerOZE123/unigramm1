import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Plus, Users, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Club {
  id: string;
  club_name: string;
  logo_url: string | null;
  category: string | null;
  member_count: number | null;
}

interface CampusGroupsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const CampusGroupsStep = ({ value, onChange }: CampusGroupsStepProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [customGroup, setCustomGroup] = useState('');
  const [universityClubs, setUniversityClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Fetch clubs from user's university
  useEffect(() => {
    const fetchUniversityClubs = async () => {
      if (!user) return;

      try {
        // Get user's university
        const { data: profile } = await supabase
          .from('profiles')
          .select('university')
          .eq('user_id', user.id)
          .single();

        if (!profile?.university) {
          setLoading(false);
          return;
        }

        // Fetch clubs from this university
        const { data: clubs, error } = await supabase
          .from('clubs_profiles')
          .select('id, club_name, logo_url, category, member_count')
          .eq('university', profile.university)
          .order('member_count', { ascending: false });

        if (error) throw error;
        setUniversityClubs(clubs || []);
        setFilteredClubs(clubs || []);

        // Check for existing pending requests
        const { data: existingRequests } = await supabase
          .from('club_join_requests')
          .select('club_id')
          .eq('student_id', user.id)
          .eq('request_type', 'request')
          .eq('status', 'pending');

        if (existingRequests) {
          setPendingRequests(new Set(existingRequests.map(r => r.club_id)));
        }

        // Check for existing memberships
        const { data: memberships } = await supabase
          .from('club_memberships')
          .select('club_id')
          .eq('user_id', user.id);

        if (memberships) {
          setSelectedClubIds(memberships.map(m => m.club_id));
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityClubs();
  }, [user]);

  // Filter clubs based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = universityClubs.filter(club =>
        club.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClubs(filtered);
    } else {
      setFilteredClubs(universityClubs);
    }
  }, [searchQuery, universityClubs]);

  const sendJoinRequest = async (club: Club) => {
    if (!user) return;

    setSendingRequest(club.id);
    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('club_join_requests')
        .select('id, status')
        .eq('club_id', club.id)
        .eq('student_id', user.id)
        .eq('request_type', 'request')
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          toast.info('You already have a pending request to this club');
          return;
        }
        // Re-send if previously rejected
        await supabase
          .from('club_join_requests')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('club_join_requests')
          .insert({
            club_id: club.id,
            student_id: user.id,
            status: 'pending',
            request_type: 'request'
          });
      }

      setPendingRequests(prev => new Set([...prev, club.id]));
      
      // Add club name to the form value for display
      if (!value.includes(club.club_name)) {
        onChange([...value, club.club_name]);
      }

      toast.success(`Join request sent to ${club.club_name}`);
    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error('Failed to send join request');
    } finally {
      setSendingRequest(null);
    }
  };

  const cancelRequest = async (club: Club) => {
    if (!user) return;

    try {
      await supabase
        .from('club_join_requests')
        .delete()
        .eq('club_id', club.id)
        .eq('student_id', user.id)
        .eq('request_type', 'request')
        .eq('status', 'pending');

      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(club.id);
        return newSet;
      });

      // Remove from form value
      onChange(value.filter(g => g !== club.club_name));

      toast.success('Request cancelled');
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const addCustomGroup = () => {
    if (customGroup.trim() && !value.includes(customGroup.trim())) {
      onChange([...value, customGroup.trim()]);
      setCustomGroup('');
    }
  };

  const removeGroup = (group: string) => {
    // Find if this matches a club
    const club = universityClubs.find(c => c.club_name === group);
    if (club && pendingRequests.has(club.id)) {
      cancelRequest(club);
    } else {
      onChange(value.filter(g => g !== group));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Join campus clubs & organizations</h2>
        <p className="text-muted-foreground">Select clubs to send join requests</p>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search clubs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : universityClubs.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
            {filteredClubs.map((club) => {
              const isPending = pendingRequests.has(club.id);
              const isMember = selectedClubIds.includes(club.id);
              
              return (
                <div
                  key={club.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={club.logo_url || ''} />
                      <AvatarFallback>
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{club.club_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {club.category && <span>{club.category}</span>}
                        {club.member_count && (
                          <span>• {club.member_count} members</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isMember ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="h-3 w-3 mr-1" />
                      Member
                    </Badge>
                  ) : isPending ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelRequest(club)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      Pending
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendJoinRequest(club)}
                      disabled={sendingRequest === club.id}
                    >
                      {sendingRequest === club.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
            
            {filteredClubs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No clubs found matching your search
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No clubs found for your university yet
          </p>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Add custom group</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter group name..."
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomGroup()}
            />
            <Button size="icon" onClick={addCustomGroup} disabled={!customGroup.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {value.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Your groups & pending requests:</p>
            <div className="flex flex-wrap gap-2">
              {value.map((group) => {
                const club = universityClubs.find(c => c.club_name === group);
                const isPending = club && pendingRequests.has(club.id);
                
                return (
                  <Badge 
                    key={group} 
                    variant="secondary"
                    className={isPending ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                  >
                    {group}
                    {isPending && <span className="ml-1">(pending)</span>}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeGroup(group)}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
