import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JoinRequest {
  id: string;
  club_id: string;
  student_id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    university: string;
  } | null;
}

export const useClubJoinRequests = (clubId: string | null) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clubId) {
      fetchRequests();
    }
  }, [clubId]);

  const fetchRequests = async () => {
    if (!clubId) return;
    
    setLoading(true);
    try {
      // First get the requests
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

    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendJoinRequest = async (clubId: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('club_join_requests')
        .insert({
          club_id: clubId,
          student_id: studentId,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Join request sent successfully"
      });
    } catch (error: any) {
      console.error('Error sending join request:', error);
      if (error.code === '23505') {
        toast({
          title: "Info",
          description: "Request already sent to this student",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send join request",
          variant: "destructive"
        });
      }
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
