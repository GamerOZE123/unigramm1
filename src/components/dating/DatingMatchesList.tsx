import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DatingMatch } from '@/hooks/useDatingMatches';

interface DatingMatchesListProps {
  matches: DatingMatch[];
  activeMatchId?: string | null;
  onSelect: (match: DatingMatch) => void;
}

export default function DatingMatchesList({ matches, activeMatchId, onSelect }: DatingMatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
        <p className="font-medium text-foreground">No matches yet</p>
        <p className="text-xs text-muted-foreground mt-1">Start discovering to find your match!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {matches.map(match => {
        const hasUnread = (match.unread_count || 0) > 0;
        const isActive = activeMatchId === match.id;

        return (
          <button
            key={match.id}
            onClick={() => onSelect(match)}
            className={cn(
              'w-full flex items-center gap-3 p-4 transition-colors text-left',
              isActive
                ? 'bg-pink-500/10'
                : 'hover:bg-muted/50',
              hasUnread && !isActive && 'bg-pink-500/5'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted ring-2 ring-transparent"
                style={hasUnread ? { boxShadow: '0 0 0 2px hsl(var(--background)), 0 0 0 4px rgb(236 72 153)' } : undefined}
              >
                {match.other_user.avatar_url ? (
                  <img src={match.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                    {(match.other_user.full_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[10px] text-white font-bold">{match.unread_count}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  'text-sm truncate',
                  hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                )}>
                  {match.other_user.full_name || match.other_user.username || 'Unknown'}
                </p>
                {match.created_at && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(match.created_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              {match.last_message ? (
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {match.last_message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Say hello!
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
