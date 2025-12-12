import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StartupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup: {
    id: string;
    title: string;
    description: string;
    category: string;
    stage: string;
    looking_for: string[];
    website_url?: string | null;
    contact_email?: string | null;
    logo_url?: string | null;
    slug?: string | null;
  };
  onSuccess: () => void;
}

export default function StartupEditModal({ open, onOpenChange, startup, onSuccess }: StartupEditModalProps) {
  const [formData, setFormData] = useState({
    title: startup.title,
    description: startup.description,
    category: startup.category,
    looking_for: startup.looking_for?.join(', ') || '',
    website_url: startup.website_url || '',
    contact_email: startup.contact_email || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lookingForArray = formData.looking_for
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const { error } = await supabase
        .from('student_startups')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          looking_for: lookingForArray,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null,
        })
        .eq('id', startup.id);

      if (error) throw error;

      toast.success('Startup updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating startup:', error);
      toast.error(error.message || 'Failed to update startup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Startup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Startup Name *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., EduConnect"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your startup..."
              rows={5}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category *</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., EdTech"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Looking For</label>
            <Input
              value={formData.looking_for}
              onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
              placeholder="e.g., Co-founder, Developer (comma separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Website</label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourstartup.com"
                type="url"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contact Email</label>
              <Input
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@yourstartup.com"
                type="email"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Updating...' : 'Update Startup'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}