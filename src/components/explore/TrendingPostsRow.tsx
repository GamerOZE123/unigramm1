import React, { useEffect, useState, useRef } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { memoryCache } from '@/lib/cache';

interface TrendingPost {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
  user_id: string;
  poll_question?: string | null;
  survey_questions?: any;
  profiles: {
    username: string;
    avatar_url: string;
    university: string;
  };
}

interface TrendingPostsRowProps {
  excludePolls?: boolean;
}

// Cache key and TTL (5 minutes)
const CACHE_KEY = 'trending_posts_row';
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function TrendingPostsRow({ excludePolls = false }: TrendingPostsRowProps) {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once on mount - REMOVED realtime subscription
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTrendingPosts();
    }
  }, [excludePolls]);

  const fetchTrendingPosts = async () => {
    try {
      const cacheKey = `${CACHE_KEY}_${excludePolls}`;
      
      // Check cache first
      const cached = memoryCache.get<TrendingPost[]>(cacheKey);
      if (cached) {
        setPosts(cached);
        setLoading(false);
        return;
      }

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content, image_url, image_urls, likes_count, comments_count, user_id, created_at, poll_question, survey_questions')
        .gte('created_at', threeDaysAgo)
        .order('likes_count', { ascending: false })
        .limit(excludePolls ? 20 : 10);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Batch fetch profiles
      const uniqueUserIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, university')
        .in('user_id', uniqueUserIds);

      if (profilesError) throw profilesError;

      // Combine data
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      let combinedData = postsData.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || { username: 'Unknown', avatar_url: '', university: '' }
      }));

      // Filter out polls/surveys if excludePolls is true
      if (excludePolls) {
        combinedData = combinedData.filter(post => !post.poll_question && !post.survey_questions);
        combinedData = combinedData.slice(0, 10);
      }

      // Cache for 5 minutes
      memoryCache.set(cacheKey, combinedData, CACHE_TTL_MS);
      
      setPosts(combinedData);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Trending Posts</h2>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-[280px] h-[200px] shrink-0 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Trending Posts</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="w-[280px] shrink-0 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                <div className="h-[140px] w-full overflow-hidden">
                  <img
                    src={post.image_url || post.image_urls?.[0]}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback>{post.profiles?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{post.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{post.profiles?.university}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {post.likes_count} ❤️
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
