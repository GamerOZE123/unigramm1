import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyOnboardingData } from '@/hooks/useCompanyOnboarding';

interface CompanyInfoStepProps {
  onNext: () => void;
  onData: (data: Partial<CompanyOnboardingData>) => void;
  initialData?: Partial<CompanyOnboardingData>;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Marketing', 'Real Estate', 'Other'
];

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

export default function CompanyInfoStep({ onNext, onData, initialData }: CompanyInfoStepProps) {
  const [companyName, setCompanyName] = useState(initialData?.company_name || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [companySize, setCompanySize] = useState(initialData?.company_size || '');
  const [headquarters, setHeadquarters] = useState(initialData?.headquarters || '');

  const handleNext = () => {
    if (!companyName || !industry || !companySize || !headquarters) {
      return;
    }
    onData({ company_name: companyName, industry, company_size: companySize, headquarters });
    onNext();
  };

  const isValid = companyName && industry && companySize && headquarters;

  return (
    <div className="space-y-6 bg-card p-8 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Company Information</h2>
        <p className="text-muted-foreground">Tell us about your company</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
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
          <Label htmlFor="companySize">Company Size *</Label>
          <Select value={companySize} onValueChange={setCompanySize}>
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
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
