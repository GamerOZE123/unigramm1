import React from 'react';
import { cn } from '@/lib/utils';
import type { DatingMatch } from '@/hooks/useDatingMatches';

interface DatingMatchesListProps {
  matches: DatingMatch[];
  activeMatchId?: string | null;
  onSelect: (match: DatingMatch) => void;
}

export default function DatingMatchesList({ matches, activeMatchId, onSelect }: DatingMatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <p>No matches yet</p>
        <p className="text-xs mt-1">Start discovering to find your match!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {matches.map(match => (
        <button
          key={match.id}
          onClick={() => onSelect(match)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
            activeMatchId === match.id ? 'bg-pink-500/10' : 'hover:bg-muted/50'
          )}
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-muted">
              {match.other_user.avatar_url ? (
                <img src={match.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {(match.other_user.full_name?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            {(match.unread_count || 0) > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{match.unread_count}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {match.other_user.full_name || match.other_user.username || 'Unknown'}
            </p>
            {match.last_message && (
              <p className="text-xs text-muted-foreground truncate">{match.last_message}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
