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
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { Separator } from '@/components/ui/separator';

interface ClubMemberManagementProps {
  clubId: string;
}

export default function ClubMemberManagement({ clubId }: ClubMemberManagementProps) {
  const { members, loading, removeMember, updateMemberRole } = useClubMembers(clubId);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    setIsAddRoleDialogOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Search Bar and Add Role Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, role, or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAddRole} size="icon" variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Members grouped by role */}
      <div className="space-y-6">
        {groupedMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No members yet</p>
        ) : (
          groupedMembers.map(([role, roleMembers]) => (
            <div key={role} className="space-y-3">
              {/* Role Header */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm font-semibold">
                  {role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({roleMembers.length} {roleMembers.length === 1 ? 'member' : 'members'})
                </span>
              </div>

              {/* Members in this role */}
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {roleMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mt-4" />
            </div>
          ))
        )}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role-title">Role Title</Label>
              <Input
                id="new-role-title"
                placeholder="e.g., Videography Lead, Marketing Lead"
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create a new role category. You can then assign members to this role.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddRoleDialogOpen(false)} disabled={!newRoleTitle.trim()}>
              Create Role
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
