import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import ClubMembersRightSidebar from '@/components/university/ClubMembersRightSidebar';
import ClubPostsSection from '@/components/university/ClubPostsSection';
import ClubUpcomingEvents from '@/components/university/ClubUpcomingEvents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClubJoinRequests } from '@/hooks/useClubJoinRequests';
import ClubMemberManagement from '@/components/university/ClubMemberManagement';
import EditClubModal from '@/components/university/EditClubModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { useClubPermissions } from '@/hooks/useClubPermissions';

interface ClubProfile {
  id: string;
  club_name: string;
  club_description: string | null;
  logo_url: string | null;
  category: string | null;
  university: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  member_count: number;
  user_id: string;
}

export default function ClubDetail() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { sendJoinRequest, cancelJoinRequest } = useClubJoinRequests(clubId || null, false);
  const { permissions, loading: loadingPermissions } = useClubPermissions(clubId || null, club?.user_id);

  useEffect(() => {
    if (clubId) {
      fetchClubDetails();
      checkMembership();
    }
  }, [clubId, user]);

  // Realtime subscription for join requests and memberships
  useEffect(() => {
    if (!clubId || !user) return;

    const channel = supabase
      .channel('club-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_join_requests',
          filter: `club_id=eq.${clubId}`
        },
        () => {
          checkMembership();
          fetchClubDetails(); // Auto refresh when requests change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_memberships',
          filter: `club_id=eq.${clubId}`
        },
        () => {
          checkMembership();
          fetchClubDetails(); // Auto refresh when memberships change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, user]);

  const fetchClubDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs_profiles')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      setClub(data);
      setIsOwner(data.user_id === user?.id);
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast({
        title: "Error",
        description: "Failed to load club details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !clubId) return;
    
    try {
      // Check membership
      const { data: memberData, error: memberError } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error checking membership:', memberError);
      }

      setIsMember(!!memberData);

      // Check for pending student request (not invitation)
      const { data: requestData, error: requestError } = await supabase
        .from('club_join_requests')
        .select('id, status')
        .eq('club_id', clubId)
        .eq('student_id', user.id)
        .eq('request_type', 'request')
        .eq('status', 'pending')
        .maybeSingle();

      if (requestError && requestError.code !== 'PGRST116') {
        console.error('Error checking pending request:', requestError);
      }

      setHasPendingRequest(!!requestData);
    } catch (error) {
      console.error('Error in checkMembership:', error);
      setIsMember(false);
      setHasPendingRequest(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!user || !clubId) return;

    // If already has pending request, cancel it
    if (hasPendingRequest) {
      await cancelJoinRequest(clubId, user.id, 'request');
      setHasPendingRequest(false);
      return;
    }

    // Send new join request
    try {
      await sendJoinRequest(clubId, user.id, 'request');
      
      toast({
        title: "Success",
        description: "Join request sent! Waiting for club approval."
      });

      setHasPendingRequest(true);
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive"
      });
    }
  };

  const handleLeaveClub = async () => {
    if (!user || !clubId) return;

    try {
      // Delete membership record
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      // Also delete any related join requests (both types) to make rejoining easier
      const { error: requestsError } = await supabase
        .from('club_join_requests')
        .delete()
        .eq('club_id', clubId)
        .eq('student_id', user.id);

      if (requestsError) throw requestsError;

      toast({
        title: "Success",
        description: "You've left the club"
      });

      setIsMember(false);
      setHasPendingRequest(false);
      fetchClubDetails();
    } catch (error) {
      console.error('Error leaving club:', error);
      toast({
        title: "Error",
        description: "Failed to leave club",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading club details...</p>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Club not found</p>
            <Button onClick={() => navigate('/clubs')}>Back to Clubs</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      rightSidebar={
      <ClubMembersRightSidebar 
        clubId={clubId}
        isClubOwner={permissions.isOwner}
        isStudent={userType === 'student'}
      />
      }
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clubs')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Club Details</h1>
        </div>

        {/* Club Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <Avatar className="w-32 h-32">
                <AvatarImage src={club.logo_url || ''} />
                <AvatarFallback className="text-3xl">
                  {club.club_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">{club.club_name}</h2>
                    {club.category && (
                      <Badge variant="secondary" className="mt-2">
                        {club.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {permissions.canEditClubProfile && (
                      <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                    
                    {!permissions.isOwner && userType === 'student' && (
                      <Button
                        onClick={isMember ? handleLeaveClub : handleRequestToJoin}
                        variant={isMember ? "outline" : hasPendingRequest ? "secondary" : "default"}
                      >
                        {isMember ? 'Leave Club' : hasPendingRequest ? 'Pending... (Click to Cancel)' : 'Request to Join'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{club.member_count} members</span>
                </div>

                {club.club_description && (
                  <p className="text-foreground">{club.club_description}</p>
                )}

                {/* Website Link - Below description */}
                {club.website_url && (
                  <div className="pt-2">
                    <a 
                      href={club.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline font-medium inline-flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  </div>
                )}

                {/* Manage Members Button - For owners and admins */}
                {permissions.canManageMembers && (
                  <div className="pt-4 border-t">
                    <Button onClick={() => setShowManageMembersModal(true)} variant="outline" className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                    {permissions.role && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Your role: <Badge variant="secondary" className="text-xs">{permissions.role}</Badge>
                      </p>
                    )}
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 pt-4 border-t">
                  {club.university && (
                    <p className="text-sm text-muted-foreground">
                      <strong>University:</strong> {club.university}
                    </p>
                  )}
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
                      <span className="text-foreground">{club.contact_phone}</span>
                    </div>
                  )}
                  {club.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={club.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {club.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club Posts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Club Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ClubPostsSection clubUserId={club.user_id} />
          </CardContent>
        </Card>

        {/* Upcoming Events Section - For members who can create events */}
        {(permissions.canCreateEvents || permissions.isMember) && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ClubUpcomingEvents 
                clubId={clubId} 
                canCreate={permissions.canCreateEvents}
                canEdit={permissions.canEditEvents}
                canDelete={permissions.canDeleteEvents}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Manage Members Modal */}
      <Dialog open={showManageMembersModal} onOpenChange={setShowManageMembersModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Club Members</DialogTitle>
          </DialogHeader>
          {clubId && <ClubMemberManagement clubId={clubId} />}
        </DialogContent>
      </Dialog>

      {/* Edit Club Modal */}
      {club && (
        <EditClubModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          club={club}
          onSuccess={() => {
            fetchClubDetails();
            setShowEditModal(false);
          }}
        />
      )}
    </Layout>
  );
}
