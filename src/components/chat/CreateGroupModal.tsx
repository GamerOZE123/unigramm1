import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Search, X } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';

const groupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(50, 'Group name must be less than 50 characters'),
  description: z.string().trim().max(200, 'Description must be less than 200 characters').optional(),
  member_ids: z.array(z.string().uuid()).max(50, 'Cannot add more than 50 members')
});

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

export default function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const { users, searchUsers } = useUsers();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Search users with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => {
        searchUsers(searchQuery.trim());
        setShowResults(true);
      }, 300);
    } else {
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddUser = (selectedUser: any) => {
    if (!selectedUsers.find(u => u.user_id === selectedUser.user_id)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!user) {
      toast.error('You must be logged in to create a group');
      return;
    }

    // Validate input with Zod
    const validationResult = groupSchema.safeParse({
      name: groupName,
      description: description || undefined,
      member_ids: selectedUsers.map(u => u.user_id)
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      toast.error(errors);
      return;
    }

    setLoading(true);

    try {
      const validatedData = validationResult.data;
      
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name: validatedData.name,
          description: validatedData.description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('chat_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Add selected users as members
      if (selectedUsers.length > 0) {
        const memberInserts = selectedUsers.map(selectedUser => ({
          group_id: groupData.id,
          user_id: selectedUser.user_id,
          role: 'member',
        }));

        const { error: membersError } = await supabase
          .from('chat_group_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      toast.success('Group created successfully');
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchQuery('');
      onOpenChange(false);
      onGroupCreated?.();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error?.message || 'Failed to create group. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter out current user and already selected users
  const filteredUsers = users.filter(
    u => u.user_id !== user?.id && !selectedUsers.find(su => su.user_id === u.user_id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>
            
            {/* Add Members Section */}
            <div className="space-y-2">
              <Label>Add Members (Optional)</Label>
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {showResults && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((searchUser) => (
                        <div
                          key={searchUser.user_id}
                          className="p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleAddUser(searchUser)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                              {searchUser.avatar_url ? (
                                <img src={searchUser.avatar_url} alt={searchUser.full_name || searchUser.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {searchUser.full_name?.charAt(0) || searchUser.username?.charAt(0) || 'U'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{searchUser.full_name || searchUser.username}</p>
                              <p className="text-sm text-muted-foreground">@{searchUser.username}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No users found</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm text-muted-foreground">{selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected</p>
                  <div className="space-y-2">
                    {selectedUsers.map((selectedUser) => (
                      <div
                        key={selectedUser.user_id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                            {selectedUser.avatar_url ? (
                              <img src={selectedUser.avatar_url} alt={selectedUser.full_name || selectedUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{selectedUser.full_name || selectedUser.username}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveUser(selectedUser.user_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
