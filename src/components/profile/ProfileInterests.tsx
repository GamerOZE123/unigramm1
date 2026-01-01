import { Badge } from "@/components/ui/badge";

interface ProfileInterestsProps {
  interests?: string[] | null;
  skills?: string[] | null;
}

export default function ProfileInterests({ interests, skills }: ProfileInterestsProps) {
  const hasInterests = interests && interests.length > 0;
  const hasSkills = skills && skills.length > 0;

  if (!hasInterests && !hasSkills) return null;

  return (
    <div className="space-y-4 mt-4">
      {hasInterests && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasSkills && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
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
