import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, GripVertical, Check, Circle } from 'lucide-react';

interface Stage {
  id: string;
  startup_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  is_current: boolean;
}

interface ManageStagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startupId: string;
  onSuccess: () => void;
}

export default function ManageStagesModal({
  open,
  onOpenChange,
  startupId,
  onSuccess
}: ManageStagesModalProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  useEffect(() => {
    if (open) {
      fetchStages();
    }
  }, [open, startupId]);

  const fetchStages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('startup_stages')
        .select('*')
        .eq('startup_id', startupId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      toast.error('Please enter a stage name');
      return;
    }

    setSaving(true);
    try {
      const nextIndex = stages.length;
      const { error } = await supabase
        .from('startup_stages')
        .insert({
          startup_id: startupId,
          name: newStageName.trim(),
          description: newStageDescription.trim() || null,
          order_index: nextIndex,
          is_completed: false,
          is_current: stages.length === 0
        });

      if (error) throw error;
      
      toast.success('Stage added');
      setNewStageName('');
      setNewStageDescription('');
      fetchStages();
      onSuccess();
    } catch (error) {
      console.error('Error adding stage:', error);
      toast.error('Failed to add stage');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStage = async (stage: Stage) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('startup_stages')
        .update({
          name: stage.name,
          description: stage.description
        })
        .eq('id', stage.id);

      if (error) throw error;
      
      toast.success('Stage updated');
      setEditingStage(null);
      fetchStages();
      onSuccess();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Delete this stage?')) return;

    try {
      const { error } = await supabase
        .from('startup_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;
      
      toast.success('Stage deleted');
      fetchStages();
      onSuccess();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Failed to delete stage');
    }
  };

  const handleSetCurrent = async (stageId: string) => {
    setSaving(true);
    try {
      // First, unset all current flags
      await supabase
        .from('startup_stages')
        .update({ is_current: false })
        .eq('startup_id', startupId);

      // Find the stage index to mark all previous as completed
      const stageIndex = stages.findIndex(s => s.id === stageId);

      // Update all stages before this one as completed, this one as current
      for (let i = 0; i <= stageIndex; i++) {
        await supabase
          .from('startup_stages')
          .update({ 
            is_completed: i < stageIndex,
            is_current: i === stageIndex
          })
          .eq('id', stages[i].id);
      }

      // Set all stages after as not completed
      for (let i = stageIndex + 1; i < stages.length; i++) {
        await supabase
          .from('startup_stages')
          .update({ 
            is_completed: false,
            is_current: false
          })
          .eq('id', stages[i].id);
      }
      
      toast.success('Current stage updated');
      fetchStages();
      onSuccess();
    } catch (error) {
      console.error('Error setting current stage:', error);
      toast.error('Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Progress Stages</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Existing Stages */}
            {stages.length > 0 && (
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div 
                    key={stage.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${stage.is_current ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-2 mt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground w-4">{index + 1}</span>
                    </div>
                    
                    {editingStage?.id === stage.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingStage.name}
                          onChange={(e) => setEditingStage({...editingStage, name: e.target.value})}
                          placeholder="Stage name"
                        />
                        <Textarea
                          value={editingStage.description || ''}
                          onChange={(e) => setEditingStage({...editingStage, description: e.target.value})}
                          placeholder="Description (optional)"
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateStage(editingStage)} disabled={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingStage(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{stage.name}</p>
                            {stage.is_current && (
                              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Current</span>
                            )}
                            {stage.is_completed && !stage.is_current && (
                              <Check className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{stage.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleSetCurrent(stage.id)}
                            title="Set as current"
                          >
                            <Circle className={`h-3 w-3 ${stage.is_current ? 'fill-primary text-primary' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingStage(stage)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteStage(stage.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {stages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stages defined yet. Add your first stage below.
              </p>
            )}

            {/* Add New Stage */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-sm">Add New Stage</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Stage name (e.g., Ideation, Research, MVP...)"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional) - What happens in this stage?"
                  value={newStageDescription}
                  onChange={(e) => setNewStageDescription(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddStage} disabled={saving || !newStageName.trim()} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Stage
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
