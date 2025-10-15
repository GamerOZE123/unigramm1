import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MajorStepProps {
  value: string;
  onChange: (value: string) => void;
}

const majorOptions = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Medicine',
  'Law',
  'Arts & Humanities',
  'Natural Sciences',
  'Social Sciences',
  'Mathematics',
  'Architecture',
  'Education',
  'Other'
];

export const MajorStep = ({ value, onChange }: MajorStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What's your major?</h2>
        <p className="text-muted-foreground">Help us understand your field of study</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {majorOptions.map((major) => (
          <Card
            key={major}
            className={cn(
              "p-4 cursor-pointer transition-all hover:border-primary",
              value === major && "border-primary bg-primary/5"
            )}
            onClick={() => onChange(major)}
          >
            <div className="text-center">
              <p className="font-medium">{major}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
