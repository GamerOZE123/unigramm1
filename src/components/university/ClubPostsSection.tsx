import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/post/PostCard';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
    university: string;
  };
}

interface ClubPostsSectionProps {
  clubUserId: string;
}

export default function ClubPostsSection({ clubUserId }: ClubPostsSectionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubPosts();
  }, [clubUserId]);

  const fetchClubPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', clubUserId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url, university')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || {
            full_name: 'Unknown',
            username: 'unknown',
            avatar_url: '',
            university: ''
          }
        }));

        setPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching club posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No posts yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
