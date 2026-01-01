import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletionBarProps {
  profileData: {
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    university?: string | null;
    major?: string | null;
    banner_url?: string | null;
    status_message?: string | null;
  } | null;
  extendedProfile: {
    interests?: string[] | null;
    linkedin_url?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    website_url?: string | null;
  } | null;
  studentProfile: {
    skills?: string[] | null;
    education?: any | null;
    work_experience?: any | null;
  } | null;
}

interface CompletionItem {
  label: string;
  completed: boolean;
}

export default function ProfileCompletionBar({
  profileData,
  extendedProfile,
  studentProfile,
}: ProfileCompletionBarProps) {
  const completionItems: CompletionItem[] = [
    { label: "Profile picture", completed: !!profileData?.avatar_url },
    { label: "Full name", completed: !!profileData?.full_name },
    { label: "Bio", completed: !!profileData?.bio },
    { label: "University", completed: !!profileData?.university },
    { label: "Major", completed: !!profileData?.major },
    { label: "Banner", completed: !!profileData?.banner_url },
    { label: "Status", completed: !!profileData?.status_message },
    { label: "Interests", completed: !!(extendedProfile?.interests && extendedProfile.interests.length > 0) },
    { label: "Social link", completed: !!(extendedProfile?.linkedin_url || extendedProfile?.instagram_url || extendedProfile?.twitter_url || extendedProfile?.website_url) },
    { label: "Skills", completed: !!(studentProfile?.skills && studentProfile.skills.length > 0) },
  ];

  const completedCount = completionItems.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  if (percentage === 100) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{percentage}%</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Profile Completion</h4>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{completionItems.length} completed
            </p>
          </div>
        </div>
      </div>
      
      <Progress value={percentage} className="h-2 mb-3" />
      
      <div className="flex flex-wrap gap-2">
        {completionItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
              item.completed
                ? "bg-success/10 text-success"
                : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {item.completed ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
