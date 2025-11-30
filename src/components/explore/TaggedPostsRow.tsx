import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/post/PostCard';
import { Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TaggedPostsRow() {
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaggedPosts();
  }, []);

  const fetchTaggedPosts = async () => {
    try {
      // Get all posts that are mentioned and NOT approved (pending approval)
      const { data: mentions, error: mentionsError } = await supabase
        .from('post_startup_mentions')
        .select('post_id, startup_id')
        .limit(20);

      if (mentionsError) throw mentionsError;

      if (mentions && mentions.length > 0) {
        const postIds = mentions.map(m => m.post_id);
        
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (postsError) throw postsError;

        // Fetch profiles
        const userIds = [...new Set(posts?.map(p => p.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, university')
          .in('user_id', userIds);

        const profileMap = new Map();
        profiles?.forEach(p => profileMap.set(p.user_id, p));

        // Fetch startup info
        const startupIds = [...new Set(mentions.filter(m => postIds.includes(m.post_id)).map(m => m.startup_id))];
        const { data: startups } = await supabase
          .from('student_startups')
          .select('id, title')
          .in('id', startupIds);

        const startupMap = new Map();
        startups?.forEach(s => startupMap.set(s.id, s));

        const transformed = posts?.map(post => {
          const mention = mentions.find(m => m.post_id === post.id);
          return {
            ...post,
            profiles: profileMap.get(post.user_id),
            startup: mention ? startupMap.get(mention.startup_id) : null
          };
        }) || [];

        setTaggedPosts(transformed);
      }
    } catch (error) {
      console.error('Error fetching tagged posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || taggedPosts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Posts Tagged with Startups</h2>
        </div>
      </div>

      <div className="space-y-4">
        {taggedPosts.slice(0, 3).map((post) => (
          <div key={post.id} className="relative">
            {post.startup && (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/startup/${post.startup.id}`)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Tagged in @{post.startup.title}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}