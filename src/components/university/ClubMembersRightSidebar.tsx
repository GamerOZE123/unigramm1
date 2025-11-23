import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X, Check, Calendar, MapPin, Globe, Mail, Phone } from 'lucide-react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { useClubJoinRequests } from '@/hooks/useClubJoinRequests';
import { useUsers } from '@/hooks/useUsers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ClubMembersRightSidebarProps {
  clubId?: string;
  isClubOwner?: boolean;
  isStudent?: boolean;
  onRequestHandled?: () => void;
}

interface ClubInfo {
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
}

interface ClubEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
}

export default function ClubMembersRightSidebar({ 
  clubId, 
  isClubOwner = false, 
  isStudent = false,
  onRequestHandled 
}: ClubMembersRightSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>([]);
  const { members, loading: membersLoading } = useClubMembers(clubId || null);
  const { requests, sendJoinRequest, acceptRequest, rejectRequest } = useClubJoinRequests(clubId || null, isStudent);
  const { users, searchUsers } = useUsers();

  useEffect(() => {
    if (clubId) {
      fetchClubInfo();
      fetchUpcomingEvents();
    }
  }, [clubId]);

  const fetchClubInfo = async () => {
    if (!clubId) return;
    try {
      const { data, error } = await supabase
        .from('clubs_profiles')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      setClubInfo(data);
    } catch (error) {
      console.error('Error fetching club info:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!clubId) return;
    try {
      const { data, error } = await supabase
        .from('club_events')
        .select('id, title, event_date, event_time, location')
        .eq('club_id', clubId)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      // Filter to only show students when searching
      await searchUsers(value, 'student');
    }
  };

  const handleSendRequest = async (studentId: string) => {
    if (!clubId) return;
    // Club owners send invitations to students
    await sendJoinRequest(clubId, studentId, 'invitation');
    setSearchQuery('');
  };

  const handleAcceptRequest = async (requestId: string, studentId: string) => {
    if (isStudent) {
      // Student accepting an invite
      const request = requests.find(r => r.id === requestId);
      if (request && user) {
        await acceptRequest(requestId, user.id, request.club_id);
        onRequestHandled?.();
      }
    } else {
      // Club owner accepting a request
      if (!clubId) return;
      await acceptRequest(requestId, studentId, clubId);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectRequest(requestId);
    if (isStudent) {
      onRequestHandled?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Club Info Section */}
      {clubInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Club Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={clubInfo.logo_url || ''} />
                <AvatarFallback className="text-xl">
                  {clubInfo.club_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{clubInfo.club_name}</h3>
                {clubInfo.category && (
                  <Badge variant="secondary" className="mt-1">
                    {clubInfo.category}
                  </Badge>
                )}
              </div>
            </div>
            
            {clubInfo.club_description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {clubInfo.club_description}
              </p>
            )}

            <Separator />

            <div className="space-y-2 text-sm">
              {clubInfo.university && (
                <p className="text-muted-foreground">
                  <strong>University:</strong> {clubInfo.university}
                </p>
              )}
              {clubInfo.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${clubInfo.contact_email}`} className="text-primary hover:underline truncate">
                    {clubInfo.contact_email}
                  </a>
                </div>
              )}
              {clubInfo.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{clubInfo.contact_phone}</span>
                </div>
              )}
              {clubInfo.website_url && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={clubInfo.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    Website
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <h4 className="font-medium text-sm text-foreground">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(event.event_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Club Invitations Section (Only for students) */}
      {isStudent && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Club Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarImage src={request.club_logo_url || ''} />
                      <AvatarFallback>
                        {request.club_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{request.club_name}</p>
                      <p className="text-xs text-muted-foreground">Invite to join</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleAcceptRequest(request.id, '')}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Members Section - Grouped by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Club Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(
                  members.reduce((acc, member) => {
                    const role = member.role || 'Member';
                    if (!acc[role]) acc[role] = [];
                    acc[role].push(member);
                    return acc;
                  }, {} as Record<string, typeof members>)
                )
                .sort(([roleA], [roleB]) => {
                  if (roleA.toLowerCase() === 'member') return 1;
                  if (roleB.toLowerCase() === 'member') return -1;
                  return roleA.localeCompare(roleB);
                })
                .map(([role, roleMembers]) => (
                  <div key={role} className="space-y-3">
                    {/* Role Title with Badge */}
                    <div className="sticky top-0 bg-card z-10 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="font-semibold text-sm px-3 py-1">
                          {role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({roleMembers.length})
                        </span>
                      </div>
                      <Separator />
                    </div>
                    
                    {/* Members in this role */}
                    <div className="space-y-2 pl-3">
                      {roleMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-9 w-9 ring-2 ring-border/50">
                            <AvatarImage src={member.profiles?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {member.profiles?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.profiles?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.profiles?.university}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Join Requests Section (Only for club owners) */}
      {isClubOwner && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {request.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {request.profiles?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.profiles?.university}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleAcceptRequest(request.id, request.student_id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Search Section (Only for club owners) */}
      {isClubOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {searchQuery && users.length > 0 && (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {users.map((userItem) => {
                    // Check if user is already a member or has pending request
                    const isMember = members.some(m => m.user_id === userItem.user_id);
                    const hasPendingRequest = requests.some(r => r.student_id === userItem.user_id);
                    const isAlreadyInvited = isMember || hasPendingRequest;
                    
                    return (
                      <div key={userItem.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userItem.avatar_url || ''} />
                          <AvatarFallback>
                            {userItem.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {userItem.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userItem.university}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRequest(userItem.user_id)}
                          disabled={isAlreadyInvited}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          {isAlreadyInvited ? 'Invited' : 'Invite'}
                        </Button>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users found
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
