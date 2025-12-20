import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/post/PostCard';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  clubId?: string;
}

export default function ClubPostsSection({ clubUserId, clubId }: ClubPostsSectionProps) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [clubUserId, clubId]);

  const fetchPosts = async () => {
    try {
      // Fetch all posts by club user
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', clubUserId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch tagged posts (posts where this club is mentioned)
      let taggedPostsData: any[] = [];
      if (clubId) {
        const { data: mentionsData, error: mentionsError } = await supabase
          .from('post_club_mentions')
          .select('post_id')
          .eq('club_id', clubId);

        if (!mentionsError && mentionsData && mentionsData.length > 0) {
          const postIds = mentionsData.map(m => m.post_id);
          const { data: taggedData, error: taggedError } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)
            .order('created_at', { ascending: false });

          if (!taggedError && taggedData) {
            taggedPostsData = taggedData;
          }
        }
      }

      // Combine all post user IDs for profile fetching
      const allPostsData = [...(postsData || []), ...taggedPostsData];
      const uniquePostsData = allPostsData.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );

      if (uniquePostsData.length > 0) {
        const userIds = [...new Set(uniquePostsData.map(p => p.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url, university')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        const addProfiles = (posts: any[]) => posts.map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || {
            full_name: 'Unknown',
            username: 'unknown',
            avatar_url: '',
            university: ''
          }
        }));

        setAllPosts(addProfiles(postsData || []));
        setTaggedPosts(addProfiles(taggedPostsData));
      } else {
        setAllPosts([]);
        setTaggedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching club posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = (posts: Post[]) => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.profiles.full_name?.toLowerCase().includes(query) ||
      post.profiles.username?.toLowerCase().includes(query)
    );
  };

  const filteredAllPosts = filterPosts(allPosts);
  const filteredTaggedPosts = filterPosts(taggedPosts);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            All Posts ({filteredAllPosts.length})
          </TabsTrigger>
          <TabsTrigger value="tagged">
            Tagged ({filteredTaggedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {filteredAllPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery ? 'No posts match your search' : 'No posts yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAllPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tagged" className="mt-4">
          {filteredTaggedPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery ? 'No tagged posts match your search' : 'No tagged posts yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTaggedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
