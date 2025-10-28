import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import ClubMembersRightSidebar from '@/components/university/ClubMembersRightSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    if (clubId) {
      fetchClubDetails();
      checkMembership();
    }
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
      const { data } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

      setIsMember(!!data);
    } catch (error) {
      // Not a member
      setIsMember(false);
    }
  };

  const handleJoinClub = async () => {
    if (!user || !clubId) return;

    try {
      const { error } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You've joined the club!"
      });

      setIsMember(true);
      fetchClubDetails();
    } catch (error) {
      console.error('Error joining club:', error);
      toast({
        title: "Error",
        description: "Failed to join club",
        variant: "destructive"
      });
    }
  };

  const handleLeaveClub = async () => {
    if (!user || !clubId) return;

    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You've left the club"
      });

      setIsMember(false);
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
          isClubOwner={isOwner}
          isStudent={userType === 'student'}
        />
      }
    >
      <div className="space-y-6">
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
                  
                  {!isOwner && userType === 'student' && (
                    <Button
                      onClick={isMember ? handleLeaveClub : handleJoinClub}
                      variant={isMember ? "outline" : "default"}
                    >
                      {isMember ? 'Leave Club' : 'Join Club'}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{club.member_count} members</span>
                </div>

                {club.club_description && (
                  <p className="text-foreground">{club.club_description}</p>
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

        {/* Club Posts/Activities Section - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No recent activity
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
