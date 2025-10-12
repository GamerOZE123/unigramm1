
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hash, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTrendingUniversityPosts } from '@/hooks/useTrendingUniversityPosts';

interface RandomUser {
  user_id: string;
  full_name?: string;
  username?: string;
  university?: string;
  major?: string;
  avatar_url?: string;
}

export default function RightSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [randomUsers, setRandomUsers] = useState<RandomUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { hashtags: trendingHashtags, loading: loadingTrending } = useTrendingUniversityPosts(5);

  useEffect(() => {
    fetchRandomUsers();
  }, [user]);

  const fetchRandomUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, university, major, avatar_url')
        .neq('user_id', user.id)
        .limit(5);
      
      if (error) throw error;
      
      // Shuffle the array to get random users
      const shuffled = (data || []).sort(() => 0.5 - Math.random());
      setRandomUsers(shuffled.slice(0, 5));
    } catch (error) {
      console.error('Error fetching random users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  return (
    <aside className="hidden xl:block fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] overflow-y-auto bg-card border-l border-border p-6">
      {/* Random Users */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">People you may know</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary hover:text-primary/80"
            onClick={fetchRandomUsers}
          >
            Refresh
          </Button>
        </div>
        <div className="space-y-3">
          {loadingUsers ? (
            <div className="text-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            randomUsers.map((randomUser) => (
              <div 
                key={randomUser.user_id} 
                className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/20 transition-colors"
                onClick={() => handleUserClick(randomUser.user_id)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {randomUser.full_name?.charAt(0) || randomUser.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {randomUser.full_name || randomUser.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {randomUser.university || randomUser.major || 'Student'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Hashtags in University */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Trending in Your University</h3>
        </div>
        {loadingTrending ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : trendingHashtags.length === 0 ? (
          <p className="text-muted-foreground text-sm">No trending hashtags in your university yet</p>
        ) : (
          <div className="space-y-3">
            {trendingHashtags.map((tag, index) => (
              <div 
                key={tag.hashtag} 
                className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-muted/20 transition-colors"
                onClick={() => handleHashtagClick(tag.hashtag)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{tag.hashtag}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{tag.post_count}</div>
                  <div className="text-xs text-muted-foreground">posts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
