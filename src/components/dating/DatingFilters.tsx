import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatingFiltersProps {
  ageRange: [number, number];
  genderFilter: string;
  onAgeChange: (range: [number, number]) => void;
  onGenderChange: (g: string) => void;
}

export default function DatingFilters({ ageRange, genderFilter, onAgeChange, onGenderChange }: DatingFiltersProps) {
  return (
    <div className="space-y-6 p-4">
      <h3 className="text-sm font-semibold text-foreground">Filters</h3>
      
      <div>
        <Label className="text-xs text-muted-foreground">Age Range: {ageRange[0]} - {ageRange[1]}</Label>
        <Slider
          min={18}
          max={24}
          step={1}
          value={ageRange}
          onValueChange={(v) => onAgeChange(v as [number, number])}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Show me</Label>
        <Select value={genderFilter} onValueChange={onGenderChange}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Everyone">Everyone</SelectItem>
            <SelectItem value="Men">Men</SelectItem>
            <SelectItem value="Women">Women</SelectItem>
            <SelectItem value="Non-binary">Non-binary</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
