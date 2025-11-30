import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Search, User, ArrowLeft } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import PostCard from '@/components/post/PostCard';
import HeroBanner from '@/components/explore/HeroBanner';
import TrendingHashtagsRow from '@/components/explore/TrendingHashtagsRow';
import TrendingPostsRow from '@/components/explore/TrendingPostsRow';
import TrendingUniversitiesRow from '@/components/explore/TrendingUniversitiesRow';
import UpcomingEventsRow from '@/components/explore/UpcomingEventsRow';
import StudentStartupsRow from '@/components/explore/StudentStartupsRow';
import ExploreSidebar from '@/components/explore/ExploreSidebar';
import { supabase } from '@/integrations/supabase/client';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPosts, setSearchPosts] = useState([]);
  const [searchPostsLoading, setSearchPostsLoading] = useState(false);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

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

  const handleUserClick = (username: string) => {
    navigate(`/${username}`);
  };

  const handleHashtagClick = (hashtag) => {
    setSearchQuery(`#${hashtag}`);
    fetchSearchPosts(hashtag, 'hashtag');
  };

  const handleUniversityClick = (university) => {
    setSearchQuery(university);
    fetchSearchPosts(university, 'university');
  };

  const fetchSearchPosts = async (searchTerm, searchType) => {
    setSearchPostsLoading(true);
    try {
      if (searchType === 'hashtag') {
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, content, image_url, hashtags, user_id, created_at, likes_count, comments_count')
          .contains('hashtags', [searchTerm.toLowerCase()])
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const userIds = [...new Set(posts?.map(post => post.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, university, major')
          .in('user_id', userIds);

        const profileMap = new Map();
        profiles?.forEach(profile => profileMap.set(profile.user_id, profile));

        const transformedPosts = (posts || []).map(post => ({
          ...post,
          profiles: profileMap.get(post.user_id)
        }));

        setSearchPosts(transformedPosts);
      } else if (searchType === 'university') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('university', `%${searchTerm}%`);

        const userIds = profiles?.map(p => p.user_id) || [];

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, content, image_url, hashtags, user_id, created_at, likes_count, comments_count')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const { data: profilesWithDetails } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url, university, major')
          .in('user_id', userIds);

        const profileMap = new Map();
        profilesWithDetails?.forEach(profile => profileMap.set(profile.user_id, profile));

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

  if (searchQuery) {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className="space-y-6 px-4 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSearchQuery('')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search users, hashtags, or universities..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {searchPosts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Posts</h2>
              {searchPosts.map((post) => (
                <PostCard key={post.id} post={post} onHashtagClick={handleHashtagClick} />
              ))}
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Users</h2>
              <div className="space-y-2">
                {users.map((userResult) => (
                  <div
                    key={userResult.id}
                    onClick={() => handleUserClick(userResult.username || '')}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {userResult.avatar_url ? (
                        <img src={userResult.avatar_url} alt={userResult.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{userResult.full_name || userResult.username}</p>
                      <p className="text-sm text-muted-foreground">@{userResult.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(searchPostsLoading || loading) ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : searchPosts.length === 0 && users.length === 0 && searchQuery && (
            <div className="post-card p-8 text-center">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className="flex gap-6">
        {/* CENTER CONTENT */}
        <div className="flex-1 max-w-2xl mx-auto space-y-10 mt-6 pb-12 px-4">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search users, hashtags, or universities..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <TrendingHashtagsRow onHashtagClick={handleHashtagClick} />

          <HeroBanner />

          <TrendingPostsRow />

          <TrendingUniversitiesRow onUniversityClick={handleUniversityClick} />

          <UpcomingEventsRow />

          <StudentStartupsRow />
        </div>

        {/* RIGHT SIDEBAR - Hidden on mobile */}
        {!isMobile && (
          <div className="w-80 hidden lg:block">
            <ExploreSidebar onHashtagClick={handleHashtagClick} />
          </div>
        )}
      </div>
    </Layout>
  );
}
