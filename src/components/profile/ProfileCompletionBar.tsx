import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

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
  onItemClick?: (tab: string) => void;
}

interface CompletionItem {
  label: string;
  completed: boolean;
  tab: string;
}

export default function ProfileCompletionBar({
  profileData,
  extendedProfile,
  studentProfile,
  onItemClick,
}: ProfileCompletionBarProps) {
  const completionItems: CompletionItem[] = [
    { label: "Profile picture", completed: !!profileData?.avatar_url, tab: "media" },
    { label: "Full name", completed: !!profileData?.full_name, tab: "basic" },
    { label: "Bio", completed: !!profileData?.bio, tab: "basic" },
    { label: "University", completed: !!profileData?.university, tab: "basic" },
    { label: "Major", completed: !!profileData?.major, tab: "basic" },
    { label: "Banner", completed: !!profileData?.banner_url, tab: "media" },
    { label: "Status", completed: !!profileData?.status_message, tab: "basic" },
    { label: "Interests", completed: !!(extendedProfile?.interests && extendedProfile.interests.length > 0), tab: "interests" },
    { label: "Social link", completed: !!(extendedProfile?.linkedin_url || extendedProfile?.instagram_url || extendedProfile?.twitter_url || extendedProfile?.website_url), tab: "social" },
    { label: "Skills", completed: !!(studentProfile?.skills && studentProfile.skills.length > 0), tab: "interests" },
  ];

  const completedCount = completionItems.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  // Show incomplete items first, then completed
  const incompleteItems = completionItems.filter((item) => !item.completed);
  const completedItems = completionItems.filter((item) => item.completed);

  if (percentage === 100) return null;

  const handleItemClick = (item: CompletionItem) => {
    if (!item.completed && onItemClick) {
      onItemClick(item.tab);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{percentage}%</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Complete Your Profile</h4>
            <p className="text-xs text-muted-foreground">
              {incompleteItems.length} items remaining
            </p>
          </div>
        </div>
        {onItemClick && (
          <button
            onClick={() => onItemClick("basic")}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
          >
            Edit Profile
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <Progress value={percentage} className="h-2 mb-4" />
      
      {/* Incomplete items - clickable */}
      {incompleteItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">Click to complete:</p>
          <div className="flex flex-wrap gap-2">
            {incompleteItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all cursor-pointer border border-transparent hover:border-primary/30"
              >
                <Circle className="w-3 h-3" />
                {item.label}
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed items */}
      {completedItems.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Completed:</p>
          <div className="flex flex-wrap gap-2">
            {completedItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-success"
              >
                <CheckCircle2 className="w-3 h-3" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
