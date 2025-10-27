import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ClubOnboardingData } from '@/hooks/useClubOnboarding';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClubInfoStepProps {
  onNext: () => void;
  onData: (data: Partial<ClubOnboardingData>) => void;
  initialData?: Partial<ClubOnboardingData>;
}

const clubCategories = [
  'Academic',
  'Sports & Fitness',
  'Arts & Culture',
  'Technology',
  'Community Service',
  'Business & Entrepreneurship',
  'Social & Recreation',
  'Special Interest',
  'Other'
];

export default function ClubInfoStep({ onNext, onData, initialData }: ClubInfoStepProps) {
  const [clubName, setClubName] = useState(initialData?.club_name || '');
  const [category, setCategory] = useState(initialData?.category || '');

  const handleNext = () => {
    if (!clubName) return;
    onData({ club_name: clubName, category });
    onNext();
  };

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Club Information</h2>
        <p className="text-muted-foreground">Tell us about your club</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="clubName">Club Name *</Label>
          <Input
            id="clubName"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="Enter your club name"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {clubCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleNext} disabled={!clubName} className="w-full">
        Next
      </Button>
    </div>
  );
}
