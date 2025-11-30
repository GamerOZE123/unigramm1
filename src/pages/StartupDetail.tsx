import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Globe, Mail, Heart, Users, CheckCircle2, Circle } from 'lucide-react';
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
  logo_url: string | null;
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
  logo_url: string | null;
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
  image_urls: string[] | null;
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

  // Real-time subscription for posts
  useEffect(() => {
    if (!startup?.user_id) return;

    const channel = supabase
      .channel('startup_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${startup.user_id}`
        },
        () => {
          fetchStartupPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startup?.user_id]);

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
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('startup_id', id)
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

  const stages = [
    { key: 'Ideation', label: 'Ideation', description: 'Basic problem → solution understanding, initial vision created' },
    { key: 'Research', label: 'Research', description: 'Market research and validation' },
    { key: 'MVP Build', label: 'MVP Build', description: 'Building minimum viable product' },
    { key: 'Testing', label: 'Testing', description: 'Testing with early users' },
    { key: 'Launch', label: 'Launch', description: 'Public launch and growth' },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === startup?.stage) ?? 0;
  const progressPercentage = currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/startups')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="overflow-hidden">
          {/* Logo & Header */}
          <div className="p-6 text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted">
                {startup.logo_url ? (
                  <img 
                    src={startup.logo_url} 
                    alt={startup.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                    {startup.title.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-1">{startup.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">
              by {startup.profiles.full_name}
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {startup.description}
            </p>

            <div className="flex justify-center gap-2 mt-4">
              {startup.website_url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={startup.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" />
                    Website
                  </a>
                </Button>
              )}
              {startup.contact_email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${startup.contact_email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                onClick={toggleInterest}
                variant={isInterested ? 'default' : 'outline'}
              >
                <Heart className={`mr-2 h-4 w-4 ${isInterested ? 'fill-current' : ''}`} />
                {isInterested ? 'Interested' : 'Show Interest'}
              </Button>
            </div>
          </div>

          {/* Post Images */}
          {posts.filter(p => p.image_url || p.image_urls).length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-6 border-b">
              {posts
                .filter(p => p.image_url || (p.image_urls && p.image_urls.length > 0))
                .slice(0, 4)
                .map((post) => (
                  <div 
                    key={post.id}
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <img
                      src={post.image_url || (post.image_urls ? post.image_urls[0] : '')}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Contributors */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Contributors</h2>
            <div className="flex flex-wrap gap-6">
              {/* Founder */}
              <div className="text-center">
                <Avatar 
                  className="h-16 w-16 mb-2 cursor-pointer mx-auto"
                  onClick={() => navigate(`/${startup.profiles.username}`)}
                >
                  <AvatarImage src={startup.profiles.avatar_url} />
                  <AvatarFallback>
                    {startup.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-medium">{startup.profiles.full_name.split(' ')[0]}</p>
              </div>

              {/* Interested Contributors */}
              {interestedUsers.slice(0, 7).map((interest) => (
                <div key={interest.id} className="text-center">
                  <Avatar 
                    className="h-16 w-16 mb-2 cursor-pointer mx-auto"
                    onClick={() => navigate(`/${interest.profiles.username}`)}
                  >
                    <AvatarImage src={interest.profiles.avatar_url} />
                    <AvatarFallback>
                      {interest.profiles.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium">
                    {interest.profiles.full_name.split(' ')[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Progress</h2>
            
            {/* Stage Timeline */}
            <div className="relative mb-8">
              <Progress value={progressPercentage} className="h-2 mb-4" />
              
              <div className="flex justify-between">
                {stages.map((stage, index) => {
                  const isActive = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage.key} className="flex flex-col items-center flex-1">
                      <div className={`
                        rounded-full p-1 mb-1
                        ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      `}>
                        {isActive ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </div>
                      <span className={`text-xs text-center ${isCurrent ? 'font-semibold' : ''}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Stage Details */}
            {currentStageIndex >= 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{stages[currentStageIndex].label}</h3>
                <p className="text-sm text-muted-foreground">
                  {stages[currentStageIndex].description}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Posts Section */}
        {posts.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Recent Updates</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
