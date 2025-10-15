import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EventPreferencesStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const eventTypes = [
  { emoji: '🎓', label: 'Academic Workshops' },
  { emoji: '🎉', label: 'Social Mixers & Parties' },
  { emoji: '🏆', label: 'Competitions & Hackathons' },
  { emoji: '⚽', label: 'Sports Events' },
  { emoji: '🎨', label: 'Cultural Events' },
  { emoji: '💼', label: 'Career Networking' },
  { emoji: '🎵', label: 'Music & Entertainment' },
  { emoji: '🎮', label: 'Gaming Events' }
];

export const EventPreferencesStep = ({ value, onChange }: EventPreferencesStepProps) => {
  const toggleEvent = (event: string) => {
    if (value.includes(event)) {
      onChange(value.filter(e => e !== event));
    } else {
      onChange([...value, event]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What type of events interest you?</h2>
        <p className="text-muted-foreground">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {eventTypes.map(({ emoji, label }) => (
          <Card
            key={label}
            className={cn(
              "p-4 cursor-pointer transition-all hover:border-primary",
              value.includes(label) && "border-primary bg-primary/5"
            )}
            onClick={() => toggleEvent(label)}
          >
            <div className="text-center space-y-2">
              <div className="text-3xl">{emoji}</div>
              <p className="text-sm font-medium">{label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
