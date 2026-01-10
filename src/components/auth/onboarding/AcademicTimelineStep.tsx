import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AcademicTimelineStepProps {
  startYear: number | null;
  expectedGraduationYear: number | null;
  academicYear: string;
  onStartYearChange: (year: number) => void;
  onExpectedGraduationYearChange: (year: number) => void;
  onAcademicYearChange: (year: string) => void;
}

const currentYear = new Date().getFullYear();
const startYears = Array.from({ length: 10 }, (_, i) => currentYear - i);
const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear + i);

const academicYearOptions = [
  { value: '1st Year', label: '1st Year (Freshman)' },
  { value: '2nd Year', label: '2nd Year (Sophomore)' },
  { value: '3rd Year', label: '3rd Year (Junior)' },
  { value: '4th Year', label: '4th Year (Senior)' },
  { value: '5th Year', label: '5th Year' },
  { value: 'Graduate', label: 'Graduate Student' },
  { value: 'PhD', label: 'PhD Candidate' },
];

export const AcademicTimelineStep = ({
  startYear,
  expectedGraduationYear,
  academicYear,
  onStartYearChange,
  onExpectedGraduationYearChange,
  onAcademicYearChange,
}: AcademicTimelineStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Your Academic Timeline</h2>
        <p className="text-muted-foreground">Help us understand your journey</p>
      </div>

      <div className="space-y-4">
        {/* Current Academic Year */}
        <div className="space-y-2">
          <Label htmlFor="academic-year">What year are you in?</Label>
          <div className="grid grid-cols-2 gap-2">
            {academicYearOptions.slice(0, 4).map((option) => (
              <Card
                key={option.value}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:border-primary text-center",
                  academicYear === option.value && "border-primary bg-primary/5"
                )}
                onClick={() => onAcademicYearChange(option.value)}
              >
                <p className="font-medium text-sm">{option.label}</p>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {academicYearOptions.slice(4).map((option) => (
              <Card
                key={option.value}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:border-primary text-center",
                  academicYear === option.value && "border-primary bg-primary/5"
                )}
                onClick={() => onAcademicYearChange(option.value)}
              >
                <p className="font-medium text-sm">{option.value}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Start Year */}
        <div className="space-y-2">
          <Label htmlFor="start-year">When did you start?</Label>
          <Select
            value={startYear?.toString() || ''}
            onValueChange={(value) => onStartYearChange(parseInt(value))}
          >
            <SelectTrigger id="start-year">
              <SelectValue placeholder="Select start year" />
            </SelectTrigger>
            <SelectContent>
              {startYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expected Graduation Year */}
        <div className="space-y-2">
          <Label htmlFor="graduation-year">Expected graduation year</Label>
          <Select
            value={expectedGraduationYear?.toString() || ''}
            onValueChange={(value) => onExpectedGraduationYearChange(parseInt(value))}
          >
            <SelectTrigger id="graduation-year">
              <SelectValue placeholder="Select expected graduation year" />
            </SelectTrigger>
            <SelectContent>
              {graduationYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          🎓 This information helps us personalize your experience and prepare your graduation journey when the time comes!
        </p>
      </div>
    </div>
  );
};

export default AcademicTimelineStep;
