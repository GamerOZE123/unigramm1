import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BioStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const BioStep = ({ value, onChange }: BioStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Write a short bio that describes who you are
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="I'm a passionate computer science student interested in AI and web development..."
            className="min-h-[120px] resize-none"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/300 characters
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Tips for a great bio:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Mention your field of study or interests</li>
            <li>• Share what you're passionate about</li>
            <li>• Keep it friendly and approachable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
