import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClubOnboardingData } from '@/hooks/useClubOnboarding';

interface ClubDescriptionStepProps {
  onNext: () => void;
  onBack: () => void;
  onData: (data: Partial<ClubOnboardingData>) => void;
  initialData?: Partial<ClubOnboardingData>;
}

export default function ClubDescriptionStep({ onNext, onBack, onData, initialData }: ClubDescriptionStepProps) {
  const [description, setDescription] = useState(initialData?.club_description || '');

  const handleNext = () => {
    if (!description) return;
    onData({ club_description: description });
    onNext();
  };

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">About Your Club</h2>
        <p className="text-muted-foreground">Describe what your club does</p>
      </div>

      <div>
        <Label htmlFor="description">Club Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell students about your club, activities, and mission..."
          rows={8}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {description.length} / 1000 characters
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!description} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
