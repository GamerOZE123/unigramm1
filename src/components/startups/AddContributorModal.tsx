import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus } from 'lucide-react';

interface Profile {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  university: string | null;
}

interface AddContributorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startupId: string;
  existingContributorIds: string[];
  onSuccess: () => void;
}

export default function AddContributorModal({
  open,
  onOpenChange,
  startupId,
  existingContributorIds,
  onSuccess
}: AddContributorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [role, setRole] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, university')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .not('user_id', 'in', `(${existingContributorIds.join(',')})`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedUser) return;
    
    setAdding(true);
    try {
      const { error } = await supabase
        .from('startup_contributors')
        .insert({
          startup_id: startupId,
          user_id: selectedUser.user_id,
          role: role.trim() || null
        });

      if (error) throw error;
      
      toast.success(`${selectedUser.full_name} added as contributor`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding contributor:', error);
      toast.error('Failed to add contributor');
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setRole('');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contributor</DialogTitle>
        </DialogHeader>

        {!selectedUser ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} size="icon">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => setSelectedUser(profile)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  </div>
                </button>
              ))}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Change
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Input
                id="role"
                placeholder="e.g., Co-Founder, Developer, Designer..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdd} disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Add Contributor
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
