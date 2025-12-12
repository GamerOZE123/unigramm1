import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Globe, Mail, Heart, Plus, Settings, Trash2, ImagePlus, Users, Milestone } from 'lucide-react';
import { toast } from 'sonner';
import StartupEditModal from '@/components/startups/StartupEditModal';
import ContributorsModal from '@/components/startups/ContributorsModal';
import ManageStagesModal from '@/components/startups/ManageStagesModal';
import GalleryUploadModal from '@/components/startups/GalleryUploadModal';
import CreateStartupPostModal from '@/components/startups/CreateStartupPostModal';

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  slug: string | null;
  looking_for: string[];
  website_url?: string;
  contact_email?: string;
  created_at: string;
  logo_url: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
    university?: string;
    linkedin_url?: string;
  };
}

interface Contributor {
  id: string;
  user_id: string;
  role: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  is_current: boolean;
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
  is_approved_for_startup: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

export default function StartupDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isInterested, setIsInterested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContributorsModalOpen, setIsContributorsModalOpen] = useState(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);

  const currentStageIndex = stages.findIndex(s => s.is_current);
  const isOwner = user?.id === startup?.user_id;

  // Set selected stage to current stage when stages load
  useEffect(() => {
    if (stages.length > 0 && selectedStageIndex === null) {
      const currentIdx = stages.findIndex(s => s.is_current);
      setSelectedStageIndex(currentIdx >= 0 ? currentIdx : 0);
    }
  }, [stages, selectedStageIndex]);

  useEffect(() => {
    if (slug) {
      fetchStartupDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (startup?.id) {
      fetchContributors();
      fetchStages();
      fetchStartupPosts();
      fetchGalleryImages();
      if (user) {
        checkIfInterested();
      }
    }
  }, [startup?.id, user]);

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
      let query = supabase.from('student_startups').select('*');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');
      
      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data: startupData, error: startupError } = await query.maybeSingle();

      if (startupError) throw startupError;
      
      if (!startupData) {
        setStartup(null);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, username, university, linkedin_url')
        .eq('user_id', startupData.user_id)
        .single();

      if (profileError) throw profileError;
      
      const transformedData: Startup = {
        ...startupData,
        profiles: profileData
      };
      
      setStartup(transformedData);
    } catch (error) {
      console.error('Error fetching startup:', error);
      toast.error('Failed to load startup details');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributors = async () => {
    if (!startup?.id) return;
    
    try {
      const { data: contributorsData, error } = await supabase
        .from('startup_contributors')
        .select('id, user_id, role')
        .eq('startup_id', startup.id);

      if (error) throw error;

      if (!contributorsData || contributorsData.length === 0) {
        setContributors([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username')
        .in('user_id', contributorsData.map(c => c.user_id));

      if (profilesError) throw profilesError;

      const transformedData: Contributor[] = contributorsData.map(contributor => {
        const profile = profiles?.find(p => p.user_id === contributor.user_id);
        return {
          ...contributor,
          profiles: profile || { full_name: 'Unknown', avatar_url: null, username: 'unknown' }
        };
      });
      
      setContributors(transformedData);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    }
  };

  const fetchStages = async () => {
    if (!startup?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('startup_stages')
        .select('*')
        .eq('startup_id', startup.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchStartupPosts = async () => {
    if (!startup?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('startup_id', startup.id)
        .eq('is_approved_for_startup', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchGalleryImages = async () => {
    if (!startup?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('startup_gallery_images')
        .select('id, image_url, caption')
        .eq('startup_id', startup.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const checkIfInterested = async () => {
    if (!user || !startup?.id) return;

    try {
      const { data, error } = await supabase
        .from('startup_interests')
        .select('id')
        .eq('startup_id', startup.id)
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

    if (!startup?.id) return;

    try {
      if (isInterested) {
        const { error } = await supabase
          .from('startup_interests')
          .delete()
          .eq('startup_id', startup.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsInterested(false);
        toast.success('Interest removed');
      } else {
        const { error } = await supabase
          .from('startup_interests')
          .insert({
            startup_id: startup.id,
            user_id: user.id,
          });

        if (error) throw error;
        setIsInterested(true);
        toast.success('Interest marked!');
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast.error('Failed to update interest');
    }
  };

  const handleDeleteStartup = async () => {
    if (!startup?.id || !isOwner) return;
    
    if (!confirm('Are you sure you want to delete this startup? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('student_startups')
        .delete()
        .eq('id', startup.id);

      if (error) throw error;
      toast.success('Startup deleted successfully');
      navigate('/startups');
    } catch (error) {
      console.error('Error deleting startup:', error);
      toast.error('Failed to delete startup');
    }
  };

  // Collect all images - from gallery table first, then from posts
  const allGalleryImages = [
    ...galleryImages.map(g => g.image_url),
    ...posts.flatMap(post => {
      const images: string[] = [];
      if (post.image_url) images.push(post.image_url);
      if (post.image_urls) images.push(...post.image_urls);
      return images;
    })
  ].slice(0, 10);

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

  const displayedStageIndex = selectedStageIndex ?? (currentStageIndex >= 0 ? currentStageIndex : 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/startups')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Startup</h1>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-3xl overflow-hidden bg-muted shadow-lg">
            {startup.logo_url ? (
              <img 
                src={startup.logo_url} 
                alt={startup.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground bg-gradient-to-br from-primary/20 to-primary/5">
                {startup.title.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Startup Name + Founder */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">{startup.title}</h2>
          <p 
            className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/${startup.profiles.username}`)}
          >
            by {startup.profiles.full_name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            size="sm"
            onClick={toggleInterest}
            variant={isInterested ? 'default' : 'outline'}
          >
            <Heart className={`mr-2 h-4 w-4 ${isInterested ? 'fill-current' : ''}`} />
            {isInterested ? 'Interested' : 'Show Interest'}
          </Button>
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
        </div>

        {/* Description */}
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-2">About</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {startup.description}
          </p>
        </Card>

        {/* Image Gallery (Horizontal Scroll) */}
        {allGalleryImages.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Gallery</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allGalleryImages.map((image, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributors Row */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Contributors</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Founder */}
            <div 
              className="flex-shrink-0 flex flex-col items-center cursor-pointer"
              onClick={() => navigate(`/${startup.profiles.username}`)}
            >
              <Avatar className="h-14 w-14 mb-1 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={startup.profiles.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {startup.profiles.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{startup.profiles.full_name.split(' ')[0]}</span>
              <span className="text-[10px] text-muted-foreground">Founder</span>
            </div>

            {/* Real Contributors */}
            {contributors.map((contributor) => (
              <div 
                key={contributor.id}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/${contributor.profiles.username}`)}
              >
                <Avatar className="h-14 w-14 mb-1">
                  <AvatarImage src={contributor.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {contributor.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{contributor.profiles.full_name.split(' ')[0]}</span>
                <span className="text-[10px] text-muted-foreground">{contributor.role || 'Team'}</span>
              </div>
            ))}

            {contributors.length === 0 && (
              <p className="text-sm text-muted-foreground self-center">No contributors yet</p>
            )}
          </div>
        </div>

        {/* Progress Tracker - Only show if stages exist */}
        {stages.length > 0 && (
          <>
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Progress</h3>
              
              {/* Dots + Lines */}
              <div className="relative flex items-center justify-between mb-3">
                {/* Connecting Line */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-muted" />
                <div 
                  className="absolute top-3 left-0 h-0.5 bg-primary transition-all duration-300"
                  style={{ width: `${(currentStageIndex / Math.max(stages.length - 1, 1)) * 100}%` }}
                />
                
                {/* Stage Dots */}
                {stages.map((stage, index) => {
                  const isCompleted = stage.is_completed || index < currentStageIndex;
                  const isCurrent = stage.is_current;
                  const isSelected = index === displayedStageIndex;
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStageIndex(index)}
                      className="relative z-10 flex flex-col items-center focus:outline-none group"
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                        ${isCompleted || isCurrent ? 'bg-primary' : 'bg-muted border-2 border-muted-foreground/30'}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''}
                        ${isCurrent ? 'shadow-lg' : ''}
                        group-hover:scale-110
                      `}>
                        {(isCompleted || isCurrent) && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <span className={`
                        text-[10px] mt-2 text-center w-14 transition-colors line-clamp-1
                        ${isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'}
                        ${isCurrent ? 'font-semibold' : ''}
                      `}>
                        {stage.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Description Box */}
            {stages[displayedStageIndex] && (
              <Card className="p-5 mb-6 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${displayedStageIndex <= currentStageIndex || stages[displayedStageIndex]?.is_completed ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <h4 className="font-semibold">{stages[displayedStageIndex].name}</h4>
                  {stages[displayedStageIndex].is_current && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stages[displayedStageIndex].description || 'No description provided for this stage.'}
                </p>
              </Card>
            )}
          </>
        )}

        {/* No stages message for non-owners */}
        {stages.length === 0 && !isOwner && (
          <Card className="p-5 mb-6">
            <p className="text-sm text-muted-foreground text-center">
              No progress stages defined yet.
            </p>
          </Card>
        )}

        {/* Admin Controls Panel */}
        {isOwner && (
          <Card className="p-4 mb-6 border-dashed">
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Admin Controls</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setIsPostModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add Post</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setIsContributorsModalOpen(true)}
              >
                <Users className="h-4 w-4" />
                <span className="text-xs">Contributors</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setIsStagesModalOpen(true)}
              >
                <Milestone className="h-4 w-4" />
                <span className="text-xs">Stages</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setIsGalleryModalOpen(true)}
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-xs">Gallery</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-3 text-destructive hover:text-destructive"
                onClick={handleDeleteStartup}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Modals */}
        {isOwner && startup && (
          <>
            <StartupEditModal
              open={isEditModalOpen}
              onOpenChange={setIsEditModalOpen}
              startup={startup}
              onSuccess={fetchStartupDetails}
            />
            <ContributorsModal
              open={isContributorsModalOpen}
              onOpenChange={setIsContributorsModalOpen}
              startupId={startup.id}
              ownerId={startup.user_id}
              onSuccess={fetchContributors}
            />
            <ManageStagesModal
              open={isStagesModalOpen}
              onOpenChange={setIsStagesModalOpen}
              startupId={startup.id}
              onSuccess={() => { fetchStages(); setSelectedStageIndex(null); }}
            />
            <GalleryUploadModal
              open={isGalleryModalOpen}
              onOpenChange={setIsGalleryModalOpen}
              startupId={startup.id}
              onSuccess={fetchGalleryImages}
            />
            <CreateStartupPostModal
              open={isPostModalOpen}
              onOpenChange={setIsPostModalOpen}
              startupId={startup.id}
              startupTitle={startup.title}
              onSuccess={fetchStartupPosts}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
