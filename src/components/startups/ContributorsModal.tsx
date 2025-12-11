import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, UserPlus, Edit2 } from 'lucide-react';
import AddContributorModal from './AddContributorModal';

interface Contributor {
  id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface ContributorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startupId: string;
  ownerId: string;
  onSuccess: () => void;
}

export default function ContributorsModal({
  open,
  onOpenChange,
  startupId,
  ownerId,
  onSuccess
}: ContributorsModalProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (open) {
      fetchContributors();
    }
  }, [open, startupId]);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const { data: contributorsData, error } = await supabase
        .from('startup_contributors')
        .select('id, user_id, role, joined_at')
        .eq('startup_id', startupId);

      if (error) throw error;

      if (!contributorsData || contributorsData.length === 0) {
        setContributors([]);
        return;
      }

      // Fetch profiles for contributors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', contributorsData.map(c => c.user_id));

      if (profilesError) throw profilesError;

      const transformedData: Contributor[] = contributorsData.map(contributor => {
        const profile = profiles?.find(p => p.user_id === contributor.user_id);
        return {
          ...contributor,
          profiles: profile || { full_name: 'Unknown', username: 'unknown', avatar_url: null }
        };
      });

      setContributors(transformedData);
    } catch (error) {
      console.error('Error fetching contributors:', error);
      toast.error('Failed to load contributors');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (contributorId: string) => {
    if (!confirm('Remove this contributor?')) return;

    try {
      const { error } = await supabase
        .from('startup_contributors')
        .delete()
        .eq('id', contributorId);

      if (error) throw error;
      
      toast.success('Contributor removed');
      fetchContributors();
      onSuccess();
    } catch (error) {
      console.error('Error removing contributor:', error);
      toast.error('Failed to remove contributor');
    }
  };

  const handleUpdateRole = async (contributorId: string) => {
    try {
      const { error } = await supabase
        .from('startup_contributors')
        .update({ role: editRole.trim() || null })
        .eq('id', contributorId);

      if (error) throw error;
      
      toast.success('Role updated');
      setEditingId(null);
      fetchContributors();
      onSuccess();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const existingContributorIds = [ownerId, ...contributors.map(c => c.user_id)];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Contributors</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {contributors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contributors yet. Add team members to your startup!
                </p>
              )}

              {contributors.map((contributor) => (
                <div key={contributor.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contributor.profiles.avatar_url || undefined} />
                    <AvatarFallback>{contributor.profiles.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contributor.profiles.full_name}</p>
                    {editingId === contributor.id ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Role..."
                          className="h-7 text-xs"
                        />
                        <Button size="sm" className="h-7" onClick={() => handleUpdateRole(contributor.id)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>×</Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {contributor.role || 'Team Member'}
                      </p>
                    )}
                  </div>

                  {editingId !== contributor.id && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => { setEditingId(contributor.id); setEditRole(contributor.role || ''); }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(contributor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <Button 
                onClick={() => setAddModalOpen(true)} 
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contributor
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddContributorModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        startupId={startupId}
        existingContributorIds={existingContributorIds}
        onSuccess={() => { fetchContributors(); onSuccess(); }}
      />
    </>
  );
}
