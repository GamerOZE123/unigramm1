import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { useClubJoinRequests } from '@/hooks/useClubJoinRequests';
import { useUsers } from '@/hooks/useUsers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface ClubMembersRightSidebarProps {
  clubId?: string;
  isClubOwner?: boolean;
  isStudent?: boolean;
  onRequestHandled?: () => void;
}

export default function ClubMembersRightSidebar({ 
  clubId, 
  isClubOwner = false, 
  isStudent = false,
  onRequestHandled 
}: ClubMembersRightSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { members, loading: membersLoading } = useClubMembers(clubId || null);
  const { requests, sendJoinRequest, acceptRequest, rejectRequest } = useClubJoinRequests(clubId || null, isStudent);
  const { users, searchUsers } = useUsers();

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      await searchUsers(value);
    }
  };

  const handleSendRequest = async (studentId: string) => {
    if (!clubId) return;
    await sendJoinRequest(clubId, studentId);
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

  // For students, show join requests
  if (isStudent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Club Invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending invitations
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    );
  }

  // For club owners, show members and requests
  return (
    <div className="space-y-4">
      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {membersLoading ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profiles?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                  {users.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.university}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRequest(user.user_id)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Invite
                      </Button>
                    </div>
                  ))}
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