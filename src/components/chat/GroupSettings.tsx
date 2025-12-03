import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Camera, 
  UserPlus, 
  UserMinus, 
  Bell, 
  BellOff, 
  Save, 
  Loader2,
  Users,
  Trash2,
  X,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

interface GroupSettingsProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    created_by: string;
  };
  onClose: () => void;
  onGroupUpdated: () => void;
}

export default function GroupSettings({ group, onClose, onGroupUpdated }: GroupSettingsProps) {
  const { user } = useAuth();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [avatarUrl, setAvatarUrl] = useState(group.avatar_url || '');
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = group.created_by === user?.id;

  useEffect(() => {
    fetchMembers();
  }, [group.id]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_group_members')
        .select('id, user_id, role')
        .eq('group_id', group.id);

      if (error) throw error;

      // Fetch profiles for members
      const userIds = data?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const membersWithProfiles = (data || []).map(member => ({
        ...member,
        profile: profileMap.get(member.user_id)
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `groups/${group.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chat_groups')
        .update({
          name,
          description: description || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id);

      if (error) throw error;

      toast.success('Group settings saved');
      onGroupUpdated();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const memberIds = members.map(m => m.user_id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .not('user_id', 'in', `(${memberIds.join(',')})`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('chat_group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Member added');
      fetchMembers();
      setSearchQuery('');
      setSearchResults([]);
      onGroupUpdated();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === group.created_by) {
      toast.error("Cannot remove the group creator");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      fetchMembers();
      onGroupUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const leaveGroup = async () => {
    if (user?.id === group.created_by) {
      toast.error("Group creator cannot leave. Delete the group instead.");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Left the group');
      onClose();
      onGroupUpdated();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface/30 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Group Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Group Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center overflow-hidden ring-4 ring-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-10 h-10 text-white" />
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-2 ring-background"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-primary-foreground" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Group Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin}
              placeholder="Add a description..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 bg-surface rounded-xl space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {muteNotifications ? <BellOff className="w-4 h-4 text-muted-foreground" /> : <Bell className="w-4 h-4" />}
              <span className="text-sm">Mute notifications</span>
            </div>
            <Switch
              checked={muteNotifications}
              onCheckedChange={setMuteNotifications}
            />
          </div>
        </div>

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({members.length})
            </h3>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMember(!showAddMember)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Add Member Search */}
          {showAddMember && isAdmin && (
            <div className="p-3 bg-surface rounded-xl space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>
              {searching && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
              {searchResults.map((result) => (
                <div
                  key={result.user_id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-background cursor-pointer"
                  onClick={() => addMember(result.user_id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={result.avatar_url || ''} />
                      <AvatarFallback>{result.full_name?.charAt(0) || result.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{result.full_name || result.username}</p>
                      <p className="text-xs text-muted-foreground">@{result.username}</p>
                    </div>
                  </div>
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
              ))}
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-surface rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profile?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.profile?.full_name?.charAt(0) || member.profile?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.profile?.full_name || member.profile?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.user_id === group.created_by ? 'Admin' : member.role}
                      </p>
                    </div>
                  </div>
                  {isAdmin && member.user_id !== user?.id && member.user_id !== group.created_by && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(member.id, member.user_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pb-4">
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          )}
          {!isAdmin && (
            <Button variant="destructive" onClick={leaveGroup} className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Leave Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
