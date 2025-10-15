import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CampusIdentityStepProps {
  value: string;
  onChange: (value: string) => void;
}

const yearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate',
  'PhD',
  'Alumni'
];

export const CampusIdentityStep = ({ value, onChange }: CampusIdentityStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What year are you in?</h2>
        <p className="text-muted-foreground">This helps us personalize your experience</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {yearOptions.map((year) => (
          <Card
            key={year}
            className={cn(
              "p-4 cursor-pointer transition-all hover:border-primary",
              value === year && "border-primary bg-primary/5"
            )}
            onClick={() => onChange(year)}
          >
            <div className="text-center">
              <p className="font-medium">{year}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
