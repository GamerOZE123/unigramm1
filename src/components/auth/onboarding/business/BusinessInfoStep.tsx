import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessOnboardingData } from '@/hooks/useBusinessOnboarding';

interface BusinessInfoStepProps {
  onNext: () => void;
  onData: (data: Partial<BusinessOnboardingData>) => void;
  initialData?: Partial<BusinessOnboardingData>;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Marketing', 'Real Estate', 'Other'
];

const BUSINESS_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

export default function BusinessInfoStep({ onNext, onData, initialData }: BusinessInfoStepProps) {
  const [businessName, setBusinessName] = useState(initialData?.business_name || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [businessSize, setBusinessSize] = useState(initialData?.business_size || '');
  const [headquarters, setHeadquarters] = useState(initialData?.headquarters || '');

  const handleNext = () => {
    if (!businessName || !industry || !businessSize || !headquarters) {
      return;
    }
    onData({ business_name: businessName, industry, business_size: businessSize, headquarters });
    onNext();
  };

  const isValid = businessName && industry && businessSize && headquarters;

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">Tell us about your business</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business name"
          />
        </div>

        <div>
          <Label htmlFor="industry">Industry *</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="businessSize">Business Size *</Label>
          <Select value={businessSize} onValueChange={setBusinessSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select business size" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="headquarters">Headquarters *</Label>
          <Input
            id="headquarters"
            value={headquarters}
            onChange={(e) => setHeadquarters(e.target.value)}
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      <Button onClick={handleNext} disabled={!isValid} className="w-full">
        Next
      </Button>
    </div>
  );
}
