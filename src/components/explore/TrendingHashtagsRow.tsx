import React from 'react';
import { Hash, TrendingUp } from 'lucide-react';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TrendingHashtagsRowProps {
  onHashtagClick?: (hashtag: string) => void;
}

export default function TrendingHashtagsRow({ onHashtagClick }: TrendingHashtagsRowProps) {
  const { hashtags, loading } = useTrendingHashtags();

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-32 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Trending Now</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-4">
          {hashtags.map((tag, index) => (
            <Button
              key={tag.hashtag}
              variant="secondary"
              className="rounded-full gap-2 shrink-0"
              onClick={() => onHashtagClick?.(tag.hashtag)}
            >
              <span className="text-xs text-muted-foreground">#{index + 1}</span>
              <Hash className="w-4 h-4" />
              <span className="font-semibold">{tag.hashtag}</span>
              <Badge variant="outline" className="ml-1">
                {tag.post_count}
              </Badge>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
