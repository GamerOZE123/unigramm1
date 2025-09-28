import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import CreateAdvertisingPostModal from '@/components/advertising/CreateAdvertisingPostModal';
import AdvertisingPostDetailModal from '@/components/advertising/AdvertisingPostDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

export default function AdvertisingFixed() {
  const [selectedTab, setSelectedTab] = useState('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertising_posts')
        .select(`
          *,
          company_profiles (
            company_name,
            company_logo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPosts = (data || []).map((post: any) => ({
        id: post.id,
        title: post.title || 'Advertising Post',
        content: post.content || '',
        user_id: post.user_id,
        created_at: post.created_at,
        views_count: 0,
        click_count: 0,
        likes_count: 0,
        company_name: post.company_profiles?.company_name || 'Company',
        company_logo: post.company_profiles?.company_logo || null
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching advertising posts:', error);
      toast.error('Failed to load advertising posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      const { error } = await supabase
        .from('advertising_posts')
        .insert([{
          title: postData.title,
          content: postData.content,
          user_id: user?.id
        }]);

      if (error) throw error;

      toast.success('Advertising post created successfully');
      fetchPosts();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLikeUpdate = async () => {
    // Placeholder for like functionality
    await fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderPosts = () => {
    if (loading) {
      return (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6" onClick={() => {
              setSelectedPost(post);
              setShowDetailModal(true);
            }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{post.company_name}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="secondary">Ad</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const content = (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advertising Hub</h1>
        {user && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Ad
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Ads</TabsTrigger>
          <TabsTrigger value="analytics">My Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {renderPosts()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center text-muted-foreground">
            Analytics coming soon...
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateAdvertisingPostModal
          open={showCreateModal}
          onOpenChange={(open) => setShowCreateModal(open)}
          onPostCreated={() => fetchPosts()}
        />
      )}

      {showDetailModal && selectedPost && (
        <AdvertisingPostDetailModal
          post={selectedPost}
          open={showDetailModal}
          onOpenChange={(open) => {
            setShowDetailModal(open);
            if (!open) setSelectedPost(null);
          }}
          onVisitSite={() => {}}
        />
      )}
    </div>
  );

  return isMobile ? (
    <MobileLayout>
      <MobileHeader />
      {content}
    </MobileLayout>
  ) : (
    <Layout>{content}</Layout>
  );
}