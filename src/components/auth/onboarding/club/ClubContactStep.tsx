import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ClubOnboardingData } from '@/hooks/useClubOnboarding';
import { normalizeUrl } from '@/lib/utils';

interface ClubContactStepProps {
  onNext: () => void;
  onBack: () => void;
  onData: (data: Partial<ClubOnboardingData>) => void;
  initialData?: Partial<ClubOnboardingData>;
}

export default function ClubContactStep({ onNext, onBack, onData, initialData }: ClubContactStepProps) {
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || '');

  const handleNext = () => {
    onData({ 
      contact_email: contactEmail,
      contact_phone: contactPhone,
      website_url: websiteUrl ? normalizeUrl(websiteUrl) : ''
    });
    onNext();
  };

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-muted-foreground">How can students reach you? (optional)</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Contact Email</Label>
          <Input
            id="email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="club@university.edu"
          />
        </div>

        <div>
          <Label htmlFor="phone">Contact Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="clubwebsite.com"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
