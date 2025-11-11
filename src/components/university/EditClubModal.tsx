import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import ProfilePictureUploadStep from '@/components/auth/onboarding/ProfilePictureUploadStep';

interface ClubProfile {
  id: string;
  club_name: string;
  club_description: string;
  category: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  logo_url: string;
}

interface EditClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: ClubProfile;
  onSuccess: () => void;
}

export default function EditClubModal({ open, onOpenChange, club, onSuccess }: EditClubModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(club.logo_url || '');
  const [formData, setFormData] = useState({
    club_name: club.club_name,
    club_description: club.club_description || '',
    category: club.category || '',
    contact_email: club.contact_email || '',
    contact_phone: club.contact_phone || '',
    website_url: club.website_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clubs_profiles')
        .update({
          club_name: formData.club_name,
          club_description: formData.club_description,
          category: formData.category,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          website_url: formData.website_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', club.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Club profile updated successfully"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: "Error",
        description: "Failed to update club profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Club Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <ProfilePictureUploadStep 
              currentLogoUrl={logoUrl}
              onUploadSuccess={(url) => {
                setLogoUrl(url);
                toast({
                  title: "Success",
                  description: "Profile picture updated successfully"
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club_name">Club Name*</Label>
            <Input
              id="club_name"
              value={formData.club_name}
              onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Sports, Arts, Academic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club_description">Description</Label>
            <Textarea
              id="club_description"
              value={formData.club_description}
              onChange={(e) => setFormData({ ...formData, club_description: e.target.value })}
              rows={4}
              placeholder="Tell students about your club..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
