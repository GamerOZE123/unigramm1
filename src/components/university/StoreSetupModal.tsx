import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Store, Upload } from 'lucide-react';

interface StoreSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function StoreSetupModal({ open, onOpenChange, onSuccess }: StoreSetupModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !user) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `store-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, logoFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.store_name.trim()) {
      toast.error('Please enter a store name');
      return;
    }

    setLoading(true);

    try {
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const { error } = await supabase
        .from('student_stores')
        .insert({
          user_id: user.id,
          store_name: formData.store_name,
          store_description: formData.store_description,
          store_logo_url: logoUrl,
        });

      if (error) throw error;

      toast.success('Store created successfully!');
      onSuccess();
      onOpenChange(false);
      setFormData({ store_name: '', store_description: '' });
      setLogoFile(null);
      setLogoPreview('');
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error(error.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="h-6 w-6 text-primary" />
            Create Your Student Store
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Logo */}
          <div className="space-y-2">
            <Label>Store Logo (Optional)</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Store logo preview" 
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: 5MB. Supports: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="store_name">
              Store Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="store_name"
              placeholder="e.g., Creative Designs Store"
              value={formData.store_name}
              onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
              required
            />
          </div>

          {/* Store Description */}
          <div className="space-y-2">
            <Label htmlFor="store_description">Store Description</Label>
            <Textarea
              id="store_description"
              placeholder="Tell customers about your store, what you sell, and what makes it special..."
              value={formData.store_description}
              onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Info Box */}
          <div className="post-card bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <Store className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">What happens next?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Your store will be created instantly</li>
                  <li>• You can start listing products right away</li>
                  <li>• Set up payment methods in store settings later</li>
                  <li>• Edit store details anytime from your store page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                'Creating Store...'
              ) : (
                <>
                  <Store className="h-4 w-4" />
                  Create Store
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
