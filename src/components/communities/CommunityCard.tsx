import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Community } from '@/hooks/useCommunities';

interface CommunityCardProps {
  community: Community;
  isMember: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onClick: (id: string) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  isMember,
  onJoin,
  onLeave,
  onClick,
}) => {
  return (
    <div
      className="post-card cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={() => onClick(community.id)}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          {community.avatar_url ? (
            <img src={community.avatar_url} alt={community.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <Users className="w-6 h-6 text-emerald-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{community.name}</h3>
          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{community.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Button
          size="sm"
          variant={isMember ? 'outline' : 'default'}
          onClick={(e) => {
            e.stopPropagation();
            isMember ? onLeave(community.id) : onJoin(community.id);
          }}
        >
          {isMember ? 'Joined' : 'Join'}
        </Button>
      </div>
    </div>
  );
};
