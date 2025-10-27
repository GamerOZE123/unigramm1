import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Search, User, ArrowLeft, TrendingUp } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import PostCard from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';

interface PostImage {
  id: string;
  image_url: string;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [randomImages, setRandomImages] = useState<PostImage[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [searchPosts, setSearchPosts] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [topPostsLoading, setTopPostsLoading] = useState(true);
  const [searchPostsLoading, setSearchPostsLoading] = useState(false);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hashtags: trendingHashtags, loading: hashtagsLoading } = useTrendingHashtags();

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
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', yesterday);

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
        // Fetch posts by hashtag
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
        // Fetch posts by university
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

  useEffect(() => {
    fetchRandomImages();
    fetchTopPostsOfDay();
  }, []);

  const handleImageClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      <div className="space-y-6 px-2">
        {/* Search Header */}
        <div className="flex justify-center mt-6">
          <div className="relative w-full max-w-lg"> {/* increased max-w-xs to max-w-lg */}
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

        {/* Trending Hashtags */}
        {!searchQuery && !hashtagsLoading && trendingHashtags.length > 0 && (
          <div className="post-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending Now
            </h2>
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
                        {hashtag.post_count} {hashtag.post_count === 1 ? 'post' : 'posts'} · {hashtag.unique_users} {hashtag.unique_users === 1 ? 'user' : 'users'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Random Posts</h3>
              {imagesLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : randomImages.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
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

            {/* Top Posts of the Day Section */}
            <div className="post-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>🔥</span> Top Posts of the Day
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
