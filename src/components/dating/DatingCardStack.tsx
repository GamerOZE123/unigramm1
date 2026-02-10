import React, { useEffect } from 'react';
import DatingCard from './DatingCard';
import type { DatingCandidate } from '@/hooks/useDatingCandidates';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatingCardStackProps {
  candidates: DatingCandidate[];
  loading: boolean;
  onLike: (userId: string) => void;
  onPass: (userId: string) => void;
  onFetchMore: () => void;
  onReload: () => void;
}

export default function DatingCardStack({ candidates, loading, onLike, onPass, onFetchMore, onReload }: DatingCardStackProps) {
  // Prefetch when running low
  useEffect(() => {
    if (candidates.length <= 5 && candidates.length > 0) {
      onFetchMore();
    }
  }, [candidates.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (candidates.length === 0) return;
      const current = candidates[0];
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPass(current.user_id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onLike(current.user_id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [candidates, onLike, onPass]);

  if (loading && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
          <span className="text-3xl">💜</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No more profiles</h3>
        <p className="text-sm text-muted-foreground mb-6">Check back later for new people at your university!</p>
        <Button
          onClick={onReload}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Profiles
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center py-4">
      {/* Show top card */}
      <DatingCard
        key={candidates[0].user_id}
        candidate={candidates[0]}
        onLike={() => onLike(candidates[0].user_id)}
        onPass={() => onPass(candidates[0].user_id)}
      />
    </div>
  );
}
