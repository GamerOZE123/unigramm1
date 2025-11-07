import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfilePictureUploadStepProps {
  currentLogoUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export default function ProfilePictureUploadStep({ currentLogoUrl, onUploadSuccess }: ProfilePictureUploadStepProps) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      if (!user) toast.error('User not authenticated');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `club-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      onUploadSuccess(publicUrl);

      // Update the clubs_profiles table
      const { error: updateError } = await supabase
        .from('clubs_profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-32 h-32">
          <AvatarImage src={logoUrl} />
          <AvatarFallback>
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="w-full max-w-sm">
          <Label htmlFor="profile-pic" className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition">
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : logoUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
            </div>
            <Input
              id="profile-pic"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </Label>
        </div>
      </div>
    </div>
  );
}