import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Edit2, Trash2, Plus, Search, UserPlus, Check, X } from 'lucide-react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { useClubJoinRequests } from '@/hooks/useClubJoinRequests';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClubMemberManagementProps {
  clubId: string;
}

export default function ClubMemberManagement({ clubId }: ClubMemberManagementProps) {
  const { members, loading, removeMember, updateMemberRole } = useClubMembers(clubId);
  const { requests, loading: requestsLoading, acceptRequest, rejectRequest } = useClubJoinRequests(clubId, false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberForNewRole, setSelectedMemberForNewRole] = useState<string | null>(null);

  // Filter and group members by role
  const groupedMembers = useMemo(() => {
    // First filter by search query
    const filteredMembers = members.filter(member => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        member.profiles?.full_name?.toLowerCase().includes(query) ||
        member.role?.toLowerCase().includes(query) ||
        member.profiles?.university?.toLowerCase().includes(query)
      );
    });

    const groups: { [key: string]: typeof members } = {};
    
    filteredMembers.forEach(member => {
      const role = member.role || 'Member';
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(member);
    });

    // Sort groups: put "member" at the end
    const sortedGroups = Object.entries(groups).sort(([roleA], [roleB]) => {
      if (roleA.toLowerCase() === 'member') return 1;
      if (roleB.toLowerCase() === 'member') return -1;
      return roleA.localeCompare(roleB);
    });

    return sortedGroups;
  }, [members, searchQuery]);

  const handleAddRole = () => {
    setNewRoleTitle('');
    setSelectedMemberForNewRole(null);
    setIsAddRoleDialogOpen(true);
  };

  const handleCreateAndAssignRole = async () => {
    if (!newRoleTitle.trim() || !selectedMemberForNewRole) {
      return;
    }
    
    await updateMemberRole(selectedMemberForNewRole, newRoleTitle.trim());
    setIsAddRoleDialogOpen(false);
    setNewRoleTitle('');
    setSelectedMemberForNewRole(null);
  };

  const handleEditRole = (memberId: string, currentRole: string) => {
    setEditingMember(memberId);
    setNewRole(currentRole);
    setIsEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (editingMember && newRole.trim()) {
      await updateMemberRole(editingMember, newRole.trim());
      setIsEditDialogOpen(false);
      setEditingMember(null);
      setNewRole('');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      await removeMember(memberId);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-center">Loading members...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending' && req.request_type === 'request');

  const handleAcceptRequest = async (requestId: string, studentId: string) => {
    await acceptRequest(requestId, studentId, clubId);
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectRequest(requestId);
  };

  return (
    <div className="space-y-6">
      {/* Pending Join Requests Section */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Pending Join Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted transition-colors border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={request.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {request.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {request.profiles?.full_name || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.profiles?.university || 'No university'}
                        </p>
                        {request.profiles?.major && (
                          <p className="text-xs text-muted-foreground">
                            {request.profiles.major}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id, request.student_id)}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Member Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign roles and manage your club members
            </p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, role, or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Quick Add Role Section */}
      <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Add New Role</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create custom roles like "Videography Lead", "Marketing Lead", or "Organizing Committee" to organize your team
            </p>
            <Button onClick={handleAddRole} variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>
      </div>

      {/* Members grouped by role */}
      <div className="space-y-6">
        {groupedMembers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No members yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Invite students to join your club from the sidebar
            </p>
          </div>
        ) : (
          groupedMembers.map(([role, roleMembers]) => (
            <div key={role} className="space-y-3 p-4 rounded-lg border border-border bg-card">
              {/* Role Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                    {role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {roleMembers.length} {roleMembers.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              {/* Members in this role */}
              <div className="space-y-2 mt-4">
                {roleMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 ring-2 ring-border">
                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {member.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.profiles?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.profiles?.university}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditRole(member.id, member.role)}
                        title="Change role"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create and Assign New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role-title">Role Title</Label>
              <Input
                id="new-role-title"
                placeholder="e.g., Videography Lead, Marketing Lead, Organizing Committee"
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a custom role name for organizing your team members.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Select Member to Assign This Role</Label>
              <ScrollArea className="h-[300px] border rounded-lg p-2">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMemberForNewRole === member.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted/30 hover:bg-muted'
                      }`}
                      onClick={() => setSelectedMemberForNewRole(member.id)}
                    >
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
                        <p className="text-xs text-muted-foreground">
                          Current role: {member.role}
                        </p>
                      </div>
                      {selectedMemberForNewRole === member.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Select a member to assign the new role to. You can change roles later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAndAssignRole} 
              disabled={!newRoleTitle.trim() || !selectedMemberForNewRole}
            >
              Create and Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role / Position</Label>
                <Input
                  id="role"
                  placeholder="e.g., Videography Lead, Marketing Lead, Organizing Committee"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a custom role name for this member. Members will be grouped by their roles.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={!newRole.trim()}>
                Save Role
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
