import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterestsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const interestCategories = {
  Academic: ['Computer Science', 'Business', 'Engineering', 'Arts', 'Sciences', 'Medicine', 'Law', 'Mathematics', 'Physics', 'Chemistry'],
  'Sports & Fitness': ['Basketball', 'Football', 'Cricket', 'Gym', 'Yoga', 'Running', 'Swimming', 'Badminton', 'Tennis'],
  Creative: ['Photography', 'Music', 'Art', 'Writing', 'Design', 'Theater', 'Dance', 'Film'],
  Social: ['Volunteering', 'Student Government', 'Debate', 'Gaming', 'Cooking', 'Travel'],
  Technology: ['Coding', 'AI/ML', 'Robotics', 'Web Dev', 'Mobile Dev', 'Data Science']
};

export const InterestsStep = ({ value, onChange }: InterestsStepProps) => {
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter(i => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !value.includes(customInterest.trim())) {
      onChange([...value, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What are you interested in?</h2>
        <p className="text-muted-foreground">Select at least 3 interests</p>
        {value.length > 0 && (
          <p className="text-sm text-primary font-medium">
            {value.length} selected {value.length >= 3 && '✓'}
          </p>
        )}
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(interestCategories).map(([category, interests]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant={value.includes(interest) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors",
                    value.includes(interest) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add custom interest..."
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
        />
        <Button size="icon" onClick={addCustomInterest}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
