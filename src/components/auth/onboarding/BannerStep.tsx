import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BannerStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const BannerStep = ({ value, onChange }: BannerStepProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-banner')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-banner')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Banner uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Add a profile banner</h2>
        <p className="text-muted-foreground">Personalize your profile with a cover image</p>
      </div>
      
      <div className="flex flex-col items-center gap-6">
        <div className="w-full h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <Image className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        <label htmlFor="banner-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('banner-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Banner'}
          </Button>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};
