import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Calendar, MessageCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  university: string;
  major: string;
  followers_count: number;
  following_count: number;
}

export default function ProfileFixed() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            id: data.id || '',
            username: data.username || 'Unknown User',
            full_name: data.full_name || 'Unknown User',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
            banner_url: data.banner_url || '',
            university: data.university || '',
            major: data.major || '',
            followers_count: data.followers_count || 0,
            following_count: data.following_count || 0
          });
        }

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (postsError) throw postsError;
        setPosts(postsData || []);

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user?.id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Profile not found</h2>
              <p className="text-muted-foreground">This user profile doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const content = (
    <div className="container mx-auto py-6 space-y-6">
      {/* Banner */}
      <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary to-primary-foreground">
        {profile.banner_url && (
          <img 
            src={profile.banner_url} 
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.university && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.university}
                  </span>
                )}
                {profile.major && (
                  <Badge variant="outline">{profile.major}</Badge>
                )}
              </div>

              <div className="flex gap-6 text-sm">
                <span>
                  <strong>{profile.following_count}</strong> Following
                </span>
                <span>
                  <strong>{profile.followers_count}</strong> Followers
                </span>
              </div>

              <div className="flex gap-2">
                {!isOwnProfile && (
                  <>
                    <Button className="flex items-center gap-2">
                      Follow
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  </>
                )}
                {isOwnProfile && (
                  <Button variant="outline">Edit Profile</Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Posts</h2>
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts yet</p>
                <p className="text-sm">
                  {isOwnProfile ? "Start sharing your thoughts!" : "This user hasn't posted anything yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{post.title}</h3>
                  <p className="text-muted-foreground mb-3">{post.content}</p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-4">
                      <span>{post.likes_count || 0} likes</span>
                      <span>{post.comments_count || 0} comments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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