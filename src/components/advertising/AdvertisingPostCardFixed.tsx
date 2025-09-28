import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Eye, MousePointer, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SimplePost } from '@/types/simplified';

export default function AdvertisingPostCardFixed() {
  const [posts, setPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('advertising_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedData = (data || []).map((post: any) => ({
        id: post.id,
        title: post.title || '',
        content: post.content || '',
        user_id: post.user_id,
        created_at: post.created_at,
        views_count: 0,
        click_count: 0,
        likes_count: 0
      }));
      
      setPosts(transformedData);
    } catch (error) {
      console.error('Error fetching advertising posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please sign in to like posts.");
      return;
    }

    try {
      const { error } = await supabase
        .from('advertising_likes')
        .insert([{ advertising_post_id: postId, user_id: user.id }]);
      
      if (error) throw error;
      toast.success('Post liked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading advertising posts...</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground">Sponsored</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{post.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  {post.likes_count || 0}
                </Button>
                <span className="flex items-center text-sm text-muted-foreground">
                  <Eye className="w-4 h-4 mr-1" />
                  {post.views_count || 0}
                </span>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <ExternalLink className="w-4 h-4 mr-1" />
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}