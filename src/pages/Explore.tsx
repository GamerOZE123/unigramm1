import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Search, User, ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import PostCard from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { useTrendingUniversities } from '@/hooks/useTrendingUniversities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import ClubUpcomingEvents from '@/components/university/ClubUpcomingEvents';

interface PostImage {
  id: string;
  image_url: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  location?: string;
  club_id: string;
  clubs_profiles?: {
    club_name: string;
  };
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [randomImages, setRandomImages] = useState<PostImage[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [searchPosts, setSearchPosts] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [topPostsLoading, setTopPostsLoading] = useState(true);
  const [searchPostsLoading, setSearchPostsLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const { hashtags: trendingHashtags, loading: hashtagsLoading } = useTrendingHashtags();
  const { universities: trendingUniversities, loading: universitiesLoading } = useTrendingUniversities();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Check if it's a hashtag or university search
    if (query.startsWith('#')) {
      const searchTerm = query.slice(1).toLowerCase();
      fetchSearchPosts(searchTerm, 'hashtag');
    } else if (query.trim()) {
      searchUsers(query);
      setSearchPosts([]);
    } else {
      setSearchPosts([]);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const shuffleArray = (array: any[]) => {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const fetchRandomImages = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, image_url, image_urls')
        .limit(100);

      if (error) throw error;

      const images: PostImage[] = [];
      posts?.forEach(post => {
        if (post.image_urls && post.image_urls.length > 0) {
          post.image_urls.forEach((url: string) => {
            images.push({ id: post.id, image_url: url });
          });
        } else if (post.image_url) {
          images.push({ id: post.id, image_url: post.image_url });
        }
      });

      setRandomImages(shuffleArray(images).slice(0, 8));
    } catch (error) {
      console.error('Error fetching random images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const fetchTopPostsOfDay = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', sevenDaysAgo);

      if (postsError) throw postsError;

      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const scoredPosts = (postsData || []).map(post => {
        const profile = profilesMap.get(post.user_id);
        const engagementScore = (post.likes_count * 2) + (post.comments_count * 3) + post.views_count;
        
        return {
          ...post,
          engagementScore,
          profiles: {
            full_name: profile?.full_name || 'Anonymous User',
            username: profile?.username || 'user',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });

      scoredPosts.sort((a, b) => b.engagementScore - a.engagementScore);
      setTopPosts(scoredPosts.slice(0, 12));
    } catch (error) {
      console.error('Error fetching top posts:', error);
    } finally {
      setTopPostsLoading(false);
    }
  };

  const fetchSearchPosts = async (searchTerm: string, type: 'hashtag' | 'university') => {
    setSearchPostsLoading(true);
    try {
      if (type === 'hashtag') {
        const { data: allPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const filteredPosts = allPosts?.filter(post => {
          if (!post.hashtags || !Array.isArray(post.hashtags)) return false;
          return post.hashtags.some((tag: string) => 
            tag.toLowerCase() === searchTerm.toLowerCase()
          );
        }) || [];

        const userIds = [...new Set(filteredPosts.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, university')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });

        const transformedPosts = filteredPosts.map(post => ({
          ...post,
          profiles: profileMap.get(post.user_id)
        }));

        setSearchPosts(transformedPosts);
      } else {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, university')
          .ilike('university', `%${searchTerm}%`);

        if (profilesError) throw profilesError;

        if (!profiles || profiles.length === 0) {
          setSearchPosts([]);
          return;
        }

        const userIds = profiles.map(p => p.user_id);
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const profileMap = new Map();
        profiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });

        const transformedPosts = (posts || []).map(post => ({
          ...post,
          profiles: profileMap.get(post.user_id)
        }));

        setSearchPosts(transformedPosts);
        
        // Fetch upcoming events for this university
        const today = new Date().toISOString().split('T')[0];
        const { data: eventsData } = await supabase
          .from('club_events')
          .select('id, title, event_date, event_time, location, club_id, clubs_profiles(club_name, logo_url, university)')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(3);
        
        // Filter events by matching university
        const universityEvents = eventsData?.filter(event => 
          event.clubs_profiles?.university?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];
        
        setUpcomingEvents(universityEvents);
      }
    } catch (error) {
      console.error('Error fetching search posts:', error);
    } finally {
      setSearchPostsLoading(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
    fetchSearchPosts(hashtag, 'hashtag');
  };

  const handleUniversityClick = (university: string) => {
    setSearchQuery(`#${university}`);
    fetchSearchPosts(university, 'university');
  };

  const fetchUpcomingEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('club_events')
        .select('id, title, event_date, event_time, location, club_id, clubs_profiles(club_name)')
        .gte('event_date', today)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchRandomImages();
    fetchTopPostsOfDay();
    fetchUpcomingEvents();
  }, []);

  const handleImageClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  // Render all events view
  if (view === 'events') {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className="space-y-6 px-2 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/explore')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">All Upcoming Events</h1>
          </div>
          {loadingEvents ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="post-card p-8 text-center">
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="post-card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(event.event_date), 'MMMM dd, yyyy')}
                        {event.event_time && ` · ${event.event_time}`}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                      )}
                      {event.clubs_profiles?.club_name && (
                        <p className="text-sm text-primary mt-2 font-medium">{event.clubs_profiles.club_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Render all hashtags view
  if (view === 'hashtags') {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className="space-y-6 px-2 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/explore')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">All Trending Hashtags</h1>
          </div>
          {hashtagsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="post-card p-4">
              <div className="space-y-2">
                {trendingHashtags.map((hashtag, index) => (
                  <div
                    key={hashtag.hashtag}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleHashtagClick(hashtag.hashtag)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-semibold">#{index + 1}</span>
                      <div>
                        <p className="font-medium">#{hashtag.hashtag}</p>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.post_count} posts · {hashtag.unique_users} users
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Render all universities view
  if (view === 'universities') {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className="space-y-6 px-2 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/explore')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">All Trending Universities</h1>
          </div>
          {universitiesLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="post-card p-4">
              <div className="space-y-2">
                {trendingUniversities.map((uni, index) => (
                  <div
                    key={uni.university}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleUniversityClick(uni.university)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uni.university}</p>
                        <p className="text-sm text-muted-foreground">{uni.post_count} posts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      <div className="space-y-6 px-2">
        {/* Search Header */}
        <div className="flex justify-center mt-6">
          <div className="relative w-full max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-center"
            />
          </div>
        </div>

        {/* Mobile: Upcoming Events */}
        {isMobile && !searchQuery && (
          <div className="post-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Events
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/explore?view=events')}
                className="text-primary"
              >
                See All
              </Button>
            </div>
            {loadingEvents ? (
              <div className="text-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-2">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer border border-border/50"
                    onClick={() => navigate('/explore?view=events')}
                  >
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.event_date), 'MMM dd, yyyy')}
                      {event.event_time && ` · ${event.event_time}`}
                    </p>
                    {event.clubs_profiles?.club_name && (
                      <p className="text-xs text-primary mt-1">{event.clubs_profiles.club_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending Section - Split Layout */}
        {!searchQuery && (!hashtagsLoading || !universitiesLoading) && (trendingHashtags.length > 0 || trendingUniversities.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trending Hashtags */}
            {!hashtagsLoading && trendingHashtags.length > 0 && (
              <div className="post-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Trending Now
                  </h2>
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/explore?view=hashtags')}
                      className="text-primary"
                    >
                      See All
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[200px] md:h-[300px] pr-4">
                  <div className="space-y-2">
                    {(isMobile ? trendingHashtags.slice(0, 3) : trendingHashtags).map((hashtag, index) => (
                      <div
                        key={hashtag.hashtag}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleHashtagClick(hashtag.hashtag)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-semibold">#{index + 1}</span>
                          <div>
                            <p className="font-medium">#{hashtag.hashtag}</p>
                            <p className="text-sm text-muted-foreground">
                              {hashtag.post_count} {hashtag.post_count === 1 ? 'post' : 'posts'} · {hashtag.unique_users} {hashtag.unique_users === 1 ? 'user' : 'users'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Trending Universities */}
            {!universitiesLoading && trendingUniversities.length > 0 && (
              <div className="post-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Trending Universities
                  </h2>
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/explore?view=universities')}
                      className="text-primary"
                    >
                      See All
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[200px] md:h-[300px] pr-4">
                  <div className="space-y-2">
                    {(isMobile ? trendingUniversities.slice(0, 3) : trendingUniversities).map((uni, index) => (
                      <div
                        key={uni.university}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleUniversityClick(uni.university)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{uni.university}</p>
                            <p className="text-sm text-muted-foreground">
                              {uni.post_count} {uni.post_count === 1 ? 'post' : 'posts'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Search Posts View */}
        {searchQuery.startsWith('#') && (
          <div className="space-y-4">
            {searchPostsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="post-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : searchPosts.length > 0 ? (
              <div className="space-y-4">
                {/* Show upcoming events for university search (not hashtag) */}
                {!searchQuery.startsWith('#') && upcomingEvents.length > 0 && (
                  <div className="post-card mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Events
                    </h3>
                    <ClubUpcomingEvents 
                      limit={3} 
                      showClubInfo={true} 
                      horizontal={true}
                    />
                  </div>
                )}
                
                {searchPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={() => fetchSearchPosts(searchQuery.slice(1), 'hashtag')}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="post-card p-8 text-center">
                <p className="text-muted-foreground">No posts found for {searchQuery}</p>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="post-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Users</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => handleUserClick(user.user_id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {user.full_name || user.username}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                      {user.university && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.university}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No users found for "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Random Posts & Top Posts when no search */}
        {!searchQuery && (
          <>
            {/* Random Posts Section */}
            <div className="post-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Posts</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/all-posts')}
                  className="text-primary hover:text-primary/80"
                >
                  See All
                </Button>
              </div>
              {imagesLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : randomImages.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-hidden">
                  {randomImages.map((image, index) => (
                    <div
                      key={`${image.id}-${index}`}
                      onClick={() => handleImageClick(image.id)}
                      className="aspect-square bg-surface rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    >
                      <img
                        src={image.image_url}
                        alt="Random post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No images available</p>
                </div>
              )}
            </div>

            {/* Top Posts Section */}
            <div className="post-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>🔥</span> Top Posts
              </h3>
              {topPostsLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : topPosts.length > 0 ? (
                <div className="space-y-4">
                  {topPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdated={fetchTopPostsOfDay}
                      onHashtagClick={handleHashtagClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No trending posts today</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
