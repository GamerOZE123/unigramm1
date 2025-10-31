import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface JoinRequest {
  id: string;
  club_id: string;
  student_id: string;
  status: string;
  created_at: string;
  club_name?: string;
  club_logo_url?: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    university: string;
  } | null;
}

export const useClubJoinRequests = (clubId: string | null, isStudent: boolean = false) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clubId || isStudent) {
      fetchRequests();
      
      // Set up real-time subscription for join requests
      const subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table: 'club_join_requests'
      };
      
      // Add filter based on whether it's a student or club view
      if (isStudent && user) {
        subscriptionConfig.filter = `student_id=eq.${user.id}`;
      } else if (clubId) {
        subscriptionConfig.filter = `club_id=eq.${clubId}`;
      }
      
      const channel = supabase
        .channel('club-join-requests')
        .on('postgres_changes', subscriptionConfig, (payload) => {
          console.log('Join request change detected:', payload);
          fetchRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [clubId, isStudent, user?.id]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (isStudent && user) {
        // Fetch join requests sent to this student
        const { data: requests, error: requestsError } = await supabase
          .from('club_join_requests')
          .select('*')
          .eq('student_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        if (requests && requests.length > 0) {
          // Get club details
          const clubIds = requests.map(r => r.club_id);
          const { data: clubs, error: clubsError } = await supabase
            .from('clubs_profiles')
            .select('id, club_name, logo_url')
            .in('id', clubIds);

          if (clubsError) throw clubsError;

          const clubsMap = new Map(clubs?.map(c => [c.id, c]) || []);
          const data = requests.map(r => ({
            ...r,
            club_name: clubsMap.get(r.club_id)?.club_name,
            club_logo_url: clubsMap.get(r.club_id)?.logo_url,
            profiles: null
          }));

          setRequests(data);
        } else {
          setRequests([]);
        }
      } else if (clubId) {
        // Fetch join requests for this club
        const { data: requests, error: requestsError } = await supabase
          .from('club_join_requests')
          .select('*')
          .eq('club_id', clubId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        if (requests && requests.length > 0) {
          // Then get the profiles for those students
          const studentIds = requests.map(r => r.student_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, university')
            .in('user_id', studentIds);

          if (profilesError) throw profilesError;

          // Combine the data
          const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
          const data = requests.map(r => ({
            ...r,
            profiles: profilesMap.get(r.student_id) || null
          }));

          setRequests(data);
        } else {
          setRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendJoinRequest = async (clubId: string, studentId: string) => {
    try {
      // First check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('club_join_requests')
        .select('id, status')
        .eq('club_id', clubId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({
            title: "Already Sent",
            description: "This student already has a pending invitation",
          });
          return;
        }
        
        // If rejected or accepted, update to pending (re-invite)
        const { error: updateError } = await supabase
          .from('club_join_requests')
          .update({ 
            status: 'pending', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingRequest.id);

        if (updateError) throw updateError;
        
        toast({
          title: "Success",
          description: "Invitation sent successfully"
        });
      } else {
        // Create new request
        const { error: insertError } = await supabase
          .from('club_join_requests')
          .insert({
            club_id: clubId,
            student_id: studentId,
            status: 'pending'
          });

        if (insertError) throw insertError;
        
        toast({
          title: "Success",
          description: "Invitation sent successfully"
        });
      }
      
      // Refetch to update the UI
      await fetchRequests();
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const acceptRequest = async (requestId: string, studentId: string, clubId: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('club_join_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add to club_memberships
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: studentId,
          role: 'member'
        });

      if (membershipError) throw membershipError;
      
      toast({
        title: "Success",
        description: "Request accepted and member added"
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive"
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('club_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Request rejected"
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    }
  };

  return {
    requests,
    loading,
    sendJoinRequest,
    acceptRequest,
    rejectRequest,
    refetch: fetchRequests
  };
};
