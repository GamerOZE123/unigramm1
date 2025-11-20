import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Globe, Mail, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import PostCard from '@/components/post/PostCard';

interface StartupResponse {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  looking_for: string[];
  website_url: string | null;
  contact_email: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
    university: string;
    linkedin_url: string;
  }[];
}

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  looking_for: string[];
  website_url: string | null;
  contact_email: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
    university: string;
    linkedin_url: string;
  };
}

interface InterestedUserResponse {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
    university: string;
  }[];
}

interface InterestedUser {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
    university: string;
  };
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
}

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isInterested, setIsInterested] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStartupDetails();
      fetchInterestedUsers();
      fetchStartupPosts();
      if (user) {
        checkIfInterested();
      }
    }
  }, [id, user]);

  const fetchStartupDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('student_startups')
        .select(`
          *,
          profiles!student_startups_user_id_fkey (
            full_name,
            avatar_url,
            username,
            university,
            linkedin_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the response to match Startup interface
      const transformedData: Startup = {
        ...data,
        profiles: data.profiles[0] // Get first profile from array
      };
      
      setStartup(transformedData);
    } catch (error) {
      console.error('Error fetching startup:', error);
      toast.error('Failed to load startup details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('startup_interests')
        .select(`
          id,
          user_id,
          profiles!startup_interests_user_id_fkey (
            full_name,
            avatar_url,
            username,
            university
          )
        `)
        .eq('startup_id', id);

      if (error) throw error;
      
      // Transform the response to match InterestedUser interface
      const transformedData: InterestedUser[] = ((data || []) as unknown as InterestedUserResponse[]).map((item) => ({
        ...item,
        profiles: item.profiles[0] // Get first profile from array
      }));
      
      setInterestedUsers(transformedData);
    } catch (error) {
      console.error('Error fetching interested users:', error);
    }
  };

  const fetchStartupPosts = async () => {
    if (!startup?.user_id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', startup.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const checkIfInterested = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('startup_interests')
        .select('id')
        .eq('startup_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsInterested(!!data);
    } catch (error) {
      console.error('Error checking interest:', error);
    }
  };

  const toggleInterest = async () => {
    if (!user) {
      toast.error('Please sign in to show interest');
      return;
    }

    try {
      if (isInterested) {
        const { error } = await supabase
          .from('startup_interests')
          .delete()
          .eq('startup_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsInterested(false);
        toast.success('Interest removed');
        fetchInterestedUsers();
      } else {
        const { error } = await supabase
          .from('startup_interests')
          .insert({
            startup_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        setIsInterested(true);
        toast.success('Interest marked!');
        fetchInterestedUsers();
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast.error('Failed to update interest');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!startup) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Startup not found</h2>
          <Button onClick={() => navigate('/startups')}>Back to Startups</Button>
        </div>
      </Layout>
    );
  }

  const getStageColor = (stage: string) => {
    const colors = {
      'Idea': 'bg-blue-100 text-blue-800',
      'MVP': 'bg-purple-100 text-purple-800',
      'Launched': 'bg-green-100 text-green-800',
      'Growing': 'bg-orange-100 text-orange-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => navigate('/startups')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Startups
            </Button>

            <Card className="p-6 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={startup.profiles.avatar_url} />
                  <AvatarFallback>
                    {startup.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{startup.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>by {startup.profiles.full_name}</span>
                    <span>•</span>
                    <span>{startup.profiles.university}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{startup.category}</Badge>
                    <Badge className={getStageColor(startup.stage)}>
                      {startup.stage}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={toggleInterest}
                  variant={isInterested ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isInterested ? 'fill-current' : ''}`} />
                  {isInterested ? 'Interested' : 'Show Interest'}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">{startup.description}</p>
                </div>

                {startup.looking_for && startup.looking_for.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Looking For</h3>
                    <div className="flex flex-wrap gap-2">
                      {startup.looking_for.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  {startup.website_url && (
                    <Button variant="outline" asChild>
                      <a
                        href={startup.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                      </a>
                    </Button>
                  )}
                  {startup.contact_email && (
                    <Button variant="outline" asChild>
                      <a href={`mailto:${startup.contact_email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Contact
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Posts Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Updates</h2>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No updates yet</p>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar - Interested Users */}
          <aside className="lg:w-80 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Interested Users</h3>
                <Badge variant="secondary" className="ml-auto">
                  {interestedUsers.length}
                </Badge>
              </div>

              {interestedUsers.length > 0 ? (
                <div className="space-y-4">
                  {interestedUsers.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/profile/${interest.user_id}`)}
                    >
                      <Avatar>
                        <AvatarImage src={interest.profiles.avatar_url} />
                        <AvatarFallback>
                          {interest.profiles.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {interest.profiles.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {interest.profiles.university}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No one has shown interest yet. Be the first!
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
