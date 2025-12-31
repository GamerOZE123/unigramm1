import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Search, User, ArrowLeft, Users } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import PostCard from "@/components/post/PostCard";
import HeroBanner from "@/components/explore/HeroBanner";
import TrendingHashtagsRow from "@/components/explore/TrendingHashtagsRow";
import TrendingPostsRow from "@/components/explore/TrendingPostsRow";
import TrendingUniversitiesRow from "@/components/explore/TrendingUniversitiesRow";
import UpcomingEventsRow from "@/components/explore/UpcomingEventsRow";
import StudentStartupsRow from "@/components/explore/StudentStartupsRow";
import TaggedPostsRow from "@/components/explore/TaggedPostsRow";
import ExploreSidebar from "@/components/explore/ExploreSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClubProfile {
  id: string;
  club_name: string;
  club_description: string | null;
  logo_url: string | null;
  university: string | null;
  member_count: number | null;
  category: string | null;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPosts, setSearchPosts] = useState([]);
  const [searchClubs, setSearchClubs] = useState<ClubProfile[]>([]);
  const [searchPostsLoading, setSearchPostsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"hashtag" | "university" | "user" | null>(null);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ---------------------------------------------
  // SEARCH BAR LOGIC
  // ---------------------------------------------
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.startsWith("#")) {
      const searchTerm = query.slice(1).toLowerCase();
      setSearchType("hashtag");
      setSearchClubs([]);
      fetchHashtagPosts(searchTerm);
    } else if (query.trim()) {
      searchUsers(query);
      setSearchType("user");
      fetchSearchResults(query);
    } else {
      setSearchPosts([]);
      setSearchClubs([]);
      setSearchType(null);
    }
  };

  const handleUserClick = (username: string) => navigate(`/${username}`);
  const handleClubClick = (clubId: string) => navigate(`/clubs/${clubId}`);
  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
    setSearchType("hashtag");
    setSearchClubs([]);
    fetchHashtagPosts(hashtag);
  };
  const handleUniversityClick = (university: string) => {
    setSearchQuery(university);
    setSearchType("user");
    fetchSearchResults(university);
  };

  // ---------------------------------------------
  // FETCH SEARCH RESULTS — POSTS BY CONTENT + CLUBS BY UNIVERSITY
  // ---------------------------------------------
  const fetchSearchResults = async (searchTerm: string) => {
    setSearchPostsLoading(true);
    try {
      // Check if search term matches any university - if so, fetch clubs
      const { data: matchingUniversities } = await supabase
        .from("profiles")
        .select("university")
        .ilike("university", `%${searchTerm}%`)
        .limit(1);

      const isUniversitySearch = matchingUniversities && matchingUniversities.length > 0;

      // Fetch clubs only if searching for a university
      if (isUniversitySearch) {
        const { data: clubs } = await supabase
          .from("clubs_profiles")
          .select("id, club_name, club_description, logo_url, university, member_count, category")
          .ilike("university", `%${searchTerm}%`)
          .order("member_count", { ascending: false, nullsFirst: false });
        setSearchClubs(clubs || []);
      } else {
        setSearchClubs([]);
      }

      // Fetch posts matching content/caption OR from users at matching university
      let allPosts: any[] = [];
      const seenPostIds = new Set<string>();

      // 1. Fetch posts by content match
      const { data: contentPosts } = await supabase
        .from("posts")
        .select(`
          id, content, image_url, image_urls, hashtags, user_id, created_at,
          likes_count, comments_count, views_count, poll_question, poll_options, poll_ends_at, survey_questions
        `)
        .ilike("content", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      contentPosts?.forEach((p) => {
        if (!seenPostIds.has(p.id)) {
          seenPostIds.add(p.id);
          allPosts.push(p);
        }
      });

      // 2. If university search, also fetch posts from users at that university
      if (isUniversitySearch) {
        const { data: uniProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("university", `%${searchTerm}%`);

        const userIds = uniProfiles?.map((p) => p.user_id) || [];

        if (userIds.length > 0) {
          const { data: uniPosts } = await supabase
            .from("posts")
            .select(`
              id, content, image_url, image_urls, hashtags, user_id, created_at,
              likes_count, comments_count, views_count, poll_question, poll_options, poll_ends_at, survey_questions
            `)
            .in("user_id", userIds)
            .order("created_at", { ascending: false })
            .limit(30);

          uniPosts?.forEach((p) => {
            if (!seenPostIds.has(p.id)) {
              seenPostIds.add(p.id);
              allPosts.push(p);
            }
          });
        }
      }

      // Sort by created_at and limit
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      allPosts = allPosts.slice(0, 30);

      // Fetch profile details for all posts
      const userIds = [...new Set(allPosts.map((p) => p.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url, university")
          .in("user_id", userIds);

        const profileMap = new Map();
        profiles?.forEach((p) => profileMap.set(p.user_id, p));

        const transformed = allPosts.map((p) => ({
          ...p,
          profiles: profileMap.get(p.user_id),
        }));

        setSearchPosts(transformed);
      } else {
        setSearchPosts([]);
      }
    } catch (err) {
      console.error("Error fetching search results:", err);
    } finally {
      setSearchPostsLoading(false);
    }
  };

  // ---------------------------------------------
  // FETCH HASHTAG POSTS
  // ---------------------------------------------
  const fetchHashtagPosts = async (searchTerm: string) => {
    setSearchPostsLoading(true);
    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          id, content, image_url, image_urls, hashtags, user_id, created_at,
          likes_count, comments_count, views_count, poll_question, poll_options, poll_ends_at, survey_questions
        `)
        .contains("hashtags", [searchTerm.toLowerCase()])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(posts.map((p) => p.user_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, university")
        .in("user_id", userIds);

      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));

      const transformed = posts.map((p) => ({
        ...p,
        profiles: profileMap.get(p.user_id),
      }));

      setSearchPosts(transformed);
    } catch (err) {
      console.error("Error fetching hashtag posts:", err);
    } finally {
      setSearchPostsLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // SEARCH RESULTS SCREEN
  // -----------------------------------------------------------------
  if (searchQuery) {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className={`space-y-6 ${isMobile ? 'px-4 pt-4 pb-20' : 'px-4 mt-6 max-w-2xl mx-auto'}`}>
          {/* SEARCH BAR */}
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => {
                setSearchQuery("");
                setSearchClubs([]);
                setSearchPosts([]);
                setSearchType(null);
              }} 
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

          {/* LOADING STATE */}
          {(searchPostsLoading || loading) && (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {/* CLUBS SECTION (for university search) */}
          {!searchPostsLoading && searchClubs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clubs & Organizations
              </h2>
              <div className="space-y-3">
                {searchClubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => handleClubClick(club.id)}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={club.logo_url || undefined} alt={club.club_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {club.club_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{club.club_name}</p>
                      {club.category && (
                        <p className="text-xs text-primary">{club.category}</p>
                      )}
                      {club.club_description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {club.club_description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{club.member_count || 0}</p>
                      <p className="text-xs text-muted-foreground">members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS SECTION */}
          {!searchPostsLoading && searchPosts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {searchType === "hashtag" ? `Posts with #${searchQuery.slice(1)}` : "Posts"}
              </h2>
              {searchPosts.map((post) => (
                <PostCard key={post.id} post={post} onHashtagClick={handleHashtagClick} />
              ))}
            </div>
          )}

          {/* USERS SECTION */}
          {!loading && users.length > 0 && searchType !== "hashtag" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Users</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleUserClick(u.username || "")}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{u.full_name || u.username}</p>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NO RESULTS */}
          {!searchPostsLoading && !loading && 
            searchPosts.length === 0 && 
            searchClubs.length === 0 && 
            users.length === 0 && 
            searchQuery && (
              <div className="post-card p-8 text-center">
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              </div>
            )}
        </div>
      </Layout>
    );
  }

  // -----------------------------------------------------------------
  // MAIN EXPLORE PAGE (WITHOUT SEARCH)
  // -----------------------------------------------------------------
  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className={`${isMobile ? 'px-4 pt-4 pb-20' : 'flex gap-6 px-4 max-w-7xl mx-auto'}`}>
        {/* CENTER COLUMN */}
        <div className={`${isMobile ? 'space-y-6' : 'flex-1 max-w-2xl space-y-10 mt-6 pb-12'}`}>
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search users, hashtags, or universities..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <TrendingHashtagsRow onHashtagClick={handleHashtagClick} />

          <HeroBanner />

          {/* ⭐ TRENDING POSTS MUST NOT SHOW POLL/SURVEY */}
          <TrendingPostsRow excludePolls />

          <TrendingUniversitiesRow onUniversityClick={handleUniversityClick} />

          <UpcomingEventsRow />

          <StudentStartupsRow />

          <TaggedPostsRow />
        </div>
      </div>
      {/* RIGHT SIDEBAR - Fixed to right edge */}
      {!isMobile && (
        <div className="hidden xl:block fixed right-0 top-0 h-screen w-80 border-l overflow-y-auto p-4">
          <ExploreSidebar onHashtagClick={handleHashtagClick} />
        </div>
      )}
    </Layout>
  );
}