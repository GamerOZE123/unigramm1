import { Badge } from "@/components/ui/badge";
import { Sparkles, Code } from "lucide-react";

interface ProfileInterestsProps {
  interests?: string[] | null;
  skills?: string[] | null;
}

export default function ProfileInterests({ interests, skills }: ProfileInterestsProps) {
  const hasInterests = interests && interests.length > 0;
  const hasSkills = skills && skills.length > 0;

  if (!hasInterests && !hasSkills) return null;

  return (
    <div className="space-y-5">
      {hasInterests && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasSkills && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-accent" />
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
