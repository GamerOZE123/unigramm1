import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, Building2 } from 'lucide-react';
import { CompanyOnboardingData } from '@/hooks/useCompanyOnboarding';

interface CompanyLogoStepProps {
  onNext: () => void;
  onBack: () => void;
  onData: (data: Partial<CompanyOnboardingData>) => void;
  initialData?: Partial<CompanyOnboardingData>;
}

export default function CompanyLogoStep({ onNext, onBack, onData, initialData }: CompanyLogoStepProps) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    onData({ logo_url: logoUrl });
    onNext();
  };

  const handleSkip = () => {
    onData({ logo_url: '' });
    onNext();
  };

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Company Logo</h2>
        <p className="text-muted-foreground">Upload your company logo (optional)</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="w-40 h-40 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-16 h-16 text-muted-foreground" />
          )}
        </div>

        <div className="w-full">
          <Label htmlFor="logo" className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition">
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : 'Click to upload logo'}</span>
            </div>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="flex-1">
          Skip
        </Button>
        <Button onClick={handleNext} disabled={!logoUrl} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
