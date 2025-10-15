import { Textarea } from '@/components/ui/textarea';

interface StatusMessageStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const StatusMessageStep = ({ value, onChange }: StatusMessageStepProps) => {
  const maxLength = 150;
  const remaining = maxLength - value.length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Tell us something fun about yourself!</h2>
        <p className="text-muted-foreground">Add a short status or bio</p>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Coffee addict ☕ | Code enthusiast 💻"
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value);
            }
          }}
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-between text-sm">
          <p className="text-muted-foreground">Examples: "Aspiring entrepreneur | Pizza lover 🍕"</p>
          <p className={remaining < 20 ? 'text-destructive' : 'text-muted-foreground'}>
            {remaining} characters left
          </p>
        </div>
      </div>
    </div>
  );
};
