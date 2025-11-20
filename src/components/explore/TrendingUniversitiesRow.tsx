import React from 'react';
import { GraduationCap, TrendingUp } from 'lucide-react';
import { useTrendingUniversities } from '@/hooks/useTrendingUniversities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TrendingUniversitiesRowProps {
  onUniversityClick?: (university: string) => void;
}

export default function TrendingUniversitiesRow({ onUniversityClick }: TrendingUniversitiesRowProps) {
  const { universities, loading } = useTrendingUniversities();

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Trending Universities</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-[220px] h-[100px] shrink-0 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (universities.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Trending Universities</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {universities.map((uni, index) => (
            <Card
              key={uni.university}
              className="w-[220px] shrink-0 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onUniversityClick?.(uni.university)}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <span className="text-lg font-bold text-primary">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{uni.university}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {uni.post_count} posts
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
