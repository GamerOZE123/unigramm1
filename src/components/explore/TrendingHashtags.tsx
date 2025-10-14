import React from 'react';
import { Hash, TrendingUp, GraduationCap } from 'lucide-react';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { useTrendingUniversities } from '@/hooks/useTrendingUniversities';

interface TrendingHashtagsProps {
  onHashtagClick?: (hashtag: string) => void;
  onUniversityClick?: (university: string) => void;
}

export default function TrendingHashtags({ onHashtagClick, onUniversityClick }: TrendingHashtagsProps) {
  const { hashtags, loading: hashtagsLoading } = useTrendingHashtags();
  const { universities, loading: universitiesLoading } = useTrendingUniversities();

  const loading = hashtagsLoading || universitiesLoading;

  if (loading) {
    return (
      <div className="post-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hashtags Loading */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Trending Hashtags</h3>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Universities Loading */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Trending Universities</h3>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending Hashtags - Left Side */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Trending Hashtags</h3>
          </div>
          {hashtags.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trending hashtags yet</p>
          ) : (
            <div className="space-y-3">
              {hashtags.map((tag, index) => (
                <div 
                  key={tag.hashtag} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => onHashtagClick?.(tag.hashtag)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-4">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Hash className="w-4 h-4 text-primary" />
                      <span className="font-medium text-blue-500 hover:text-blue-600">{tag.hashtag}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{tag.post_count} posts</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Universities - Right Side */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Trending Universities</h3>
          </div>
          {universities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trending universities yet</p>
          ) : (
            <div className="space-y-3">
              {universities.map((uni, index) => (
                <div 
                  key={uni.university} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => onUniversityClick?.(uni.university)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-4">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Hash className="w-4 h-4 text-primary" />
                      <span className="font-medium text-blue-500 hover:text-blue-600">{uni.university}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{uni.post_count} posts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
