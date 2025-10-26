import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompanyOnboardingData } from '@/hooks/useCompanyOnboarding';
import { normalizeUrl } from '@/lib/utils';

interface CompanyContactStepProps {
  onNext: () => void;
  onBack: () => void;
  onData: (data: Partial<CompanyOnboardingData>) => void;
  initialData?: Partial<CompanyOnboardingData>;
}

export default function CompanyContactStep({ onNext, onBack, onData, initialData }: CompanyContactStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || '');

  const handleNext = () => {
    if (!websiteUrl) return;
    onData({ website_url: normalizeUrl(websiteUrl) });
    onNext();
  };

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-muted-foreground">How can students reach you?</p>
      </div>

      <div>
        <Label htmlFor="website">Company Website *</Label>
        <Input
          id="website"
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="example.com"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!websiteUrl} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
