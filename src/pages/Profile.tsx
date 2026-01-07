import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/post/PostCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";
import MessageButton from "@/components/profile/MessageButton";
import FollowButton from "@/components/profile/FollowButton";
import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";
import ProfileInterests from "@/components/profile/ProfileInterests";
import ProfileAffiliations from "@/components/profile/ProfileAffiliations";
import ProfileCompletionBar from "@/components/profile/ProfileCompletionBar";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, GraduationCap, MapPin, Image as ImageIcon, FileText, Calendar, Sparkles, Users, Rocket, Crown, Shield, Pin } from "lucide-react";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useProfileData } from "@/hooks/useProfileData";
import { format } from "date-fns";

interface ProfileData {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  university: string;
  major: string;
  bio: string;
  followers_count: number;
  following_count: number;
  country?: string;
  state?: string;
  area?: string;
  banner_url?: string;
  banner_height?: number;
  banner_position?: number;
  status_message?: string;
  campus_year?: string;
}

interface PostWithProfile {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
  hashtags?: string[];
  poll_question?: string | null;
  poll_options?: any | null;
  poll_ends_at?: string | null;
  survey_questions?: any | null;
  is_pinned?: boolean;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
    university: string;
  };
}

interface TransformedPost {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar?: string;
  user_university?: string;
  hashtags?: string[];
  poll_question?: string | null;
  poll_options?: any | null;
  poll_ends_at?: string | null;
  survey_questions?: any | null;
  is_pinned?: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const { username } = useParams<{ username?: string }>();
  const isMobile = useIsMobile();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const isOwnProfile = !username || (profileUserId && profileUserId === user?.id);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerHeight, setBannerHeight] = useState<number>(180);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("basic");

  // Extended profile data
  const { studentProfile, extendedProfile, clubs, startups } = useProfileData(profileUserId);

  useEffect(() => {
    if (profileData?.banner_url) setBannerUrl(profileData.banner_url);
    if (profileData?.banner_height) setBannerHeight(profileData.banner_height);
  }, [profileData?.banner_url, profileData?.banner_height]);

  useEffect(() => {
    const loadProfile = async () => {
      if (username) {
        const { data, error } = await supabase.from("profiles").select("user_id").eq("username", username).single();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setProfileUserId(data.user_id);
        fetchUserData(data.user_id);
        fetchUserPosts(data.user_id);
      } else if (user?.id) {
        setProfileUserId(user.id);
        fetchUserData(user.id);
        fetchUserPosts(user.id);
      }
    };

    loadProfile();
  }, [username, user?.id]);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (user && profileData && !isOwnProfile) {
        try {
          const { data, error } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", profileData.user_id)
            .single();

          if (error && error.code !== "PGRST116") throw error;
          setIsFollowing(!!data);
        } catch (error) {
          console.error("Error checking following status:", error);
        }
      }
    };

    checkFollowingStatus();
  }, [user, profileData, isOwnProfile]);

  const fetchUserPosts = async (userId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          content,
          image_url,
          image_urls,
          created_at,
          likes_count,
          comments_count,
          views_count,
          hashtags,
          poll_question,
          poll_options,
          poll_ends_at,
          survey_questions,
          is_pinned
        `
        )
        .eq("user_id", userId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      const { data: currentProfileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, university")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;

      const postsWithProfile: PostWithProfile[] = (postsData || []).map((post) => ({
        ...post,
        profiles: currentProfileData,
      }));

      setPosts(postsWithProfile);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const MAX_PINNED_POSTS = 3;
  const pinnedPostsCount = posts.filter(p => p.is_pinned).length;

  const handlePinPost = async (postId: string, currentlyPinned: boolean) => {
    // Check limit when trying to pin
    if (!currentlyPinned && pinnedPostsCount >= MAX_PINNED_POSTS) {
      toast.error(`You can only pin up to ${MAX_PINNED_POSTS} posts`);
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: !currentlyPinned })
        .eq("id", postId);

      if (error) throw error;
      
      toast.success(currentlyPinned ? "Post unpinned from profile" : "Post pinned to profile");
      if (profileUserId) fetchUserPosts(profileUserId);
    } catch (error) {
      console.error("Error pinning/unpinning post:", error);
      toast.error("Failed to update pin status");
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, university, major, bio, followers_count, following_count, country, state, area, banner_url, banner_height, banner_position, status_message, campus_year"
        )
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    if (profileUserId) {
      fetchUserData(profileUserId);
      fetchUserPosts(profileUserId);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileData.user_id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${profileData.full_name || profileData.username}`);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert([{ follower_id: user.id, following_id: profileData.user_id }]);

        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Followed ${profileData.full_name || profileData.username}`);
      }

      if (profileUserId) fetchUserData(profileUserId);
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast.error("Failed to follow/unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const transformPostsForPostCard = (posts: PostWithProfile[]): TransformedPost[] => {
    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      image_urls: post.image_urls,
      created_at: post.created_at,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      views_count: post.views_count || 0,
      user_id: post.user_id,
      user_name: post.profiles.full_name || post.profiles.username,
      user_username: post.profiles.username,
      user_avatar: post.profiles.avatar_url,
      user_university: post.profiles.university,
      hashtags: post.hashtags || [],
      poll_question: post.poll_question,
      poll_options: post.poll_options,
      poll_ends_at: post.poll_ends_at,
      survey_questions: post.survey_questions,
      is_pinned: post.is_pinned,
    }));
  };

  // Filter posts with media
  const mediaPosts = posts.filter((post) => post.image_url || (post.image_urls && post.image_urls.length > 0));

  // Build location string
  const locationParts = [profileData?.area, profileData?.state, profileData?.country].filter(Boolean);
  const locationString = locationParts.join(", ");

  if (loading)
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  if (!profileData)
    return (
      <Layout>
        <div className="text-center py-8">User not found</div>
      </Layout>
    );

  const transformedPosts = transformPostsForPostCard(posts);
  const transformedMediaPosts = transformPostsForPostCard(mediaPosts);

  // Format joined date
  const joinedDate = extendedProfile?.created_at
    ? format(new Date(extendedProfile.created_at), "MMMM yyyy")
    : null;

  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className="max-w-4xl mx-auto">
        {/* Banner Section with overlapping content */}
        <div className="relative">
          <div
            className="w-full h-48 md:h-56 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 overflow-hidden"
            style={{
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: `center ${profileData.banner_position || 50}%`,
            }}
          >
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            {isOwnProfile && (
              <button
                className="absolute top-4 right-4 bg-background/60 backdrop-blur-sm text-foreground rounded-full p-2.5 hover:bg-background/80 transition-all border border-border/50"
                onClick={() => setIsEditModalOpen(true)}
                aria-label="Edit banner"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Card - Overlapping Banner */}
          <div className="relative mx-4 -mt-12 md:-mt-8">
            <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-2xl shadow-xl overflow-hidden pt-14 md:pt-16">
              {/* Top Section - Avatar & Main Info */}
              <div className="p-6 pb-4">
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Avatar */}
                  <div className="flex flex-col items-center md:items-start shrink-0 -mt-20 md:-mt-24">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                        {profileData.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt={profileData.full_name || profileData.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl md:text-4xl font-bold text-primary">
                            {profileData.full_name?.charAt(0) || profileData.username?.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{profileData.full_name || profileData.username}</h1>
                          {startups.some(s => s.role === 'founder') && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs shrink-0">
                              <Crown className="w-3 h-3 mr-1" />
                              Founder
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">@{profileData.username}</p>
                        
                        {/* Status Message */}
                        {profileData.status_message && (
                          <p className="mt-2 text-sm italic text-muted-foreground/80">
                            "{profileData.status_message}"
                          </p>
                        )}
                      </div>

                      {/* Action Buttons - Desktop */}
                      <div className="hidden md:flex gap-2 shrink-0">
                        {isOwnProfile ? (
                          <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <FollowButton userId={profileData.user_id} />
                            <MessageButton userId={profileData.user_id} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Info Tags */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                      {(profileData.university || profileData.major) && (
                        <Badge variant="secondary" className="bg-primary/5 text-foreground/80 font-normal">
                          <GraduationCap className="w-3 h-3 mr-1.5 text-primary" />
                          {[profileData.university, profileData.major].filter(Boolean).join(" • ")}
                          {profileData.campus_year && <span className="ml-1 text-muted-foreground">'{profileData.campus_year.slice(-2)}</span>}
                        </Badge>
                      )}
                      {locationString && (
                        <Badge variant="secondary" className="bg-accent/5 text-foreground/80 font-normal">
                          <MapPin className="w-3 h-3 mr-1.5 text-accent" />
                          {locationString}
                        </Badge>
                      )}
                      {joinedDate && (
                        <Badge variant="secondary" className="bg-muted/50 text-foreground/80 font-normal">
                          <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
                          Joined {joinedDate}
                        </Badge>
                      )}
                    </div>

                    {/* Bio */}
                    {profileData.bio && (
                      <p className="mt-3 text-foreground/80 text-sm leading-relaxed line-clamp-2">{profileData.bio}</p>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex justify-center gap-3 mt-4 md:hidden">
                  {isOwnProfile ? (
                    <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <FollowButton userId={profileData.user_id} />
                      <MessageButton userId={profileData.user_id} />
                    </>
                  )}
                </div>
              </div>

              {/* Stats & Social Row */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border/30">
                <div className="flex items-center justify-between">
                  {/* Stats */}
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{posts.length}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{profileData.followers_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{profileData.following_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                    {startups.length > 0 && (
                      <div className="text-center hidden sm:block">
                        <div className="font-bold text-foreground">{startups.length}</div>
                        <div className="text-xs text-muted-foreground">Startups</div>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <ProfileSocialLinks
                    linkedinUrl={extendedProfile?.linkedin_url}
                    instagramUrl={extendedProfile?.instagram_url}
                    twitterUrl={extendedProfile?.twitter_url}
                    websiteUrl={extendedProfile?.website_url}
                    githubUrl={studentProfile?.github_url}
                    portfolioUrl={studentProfile?.portfolio_url}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Profile Completion Bar - Only for own profile */}
        {isOwnProfile && (
          <div className="mx-4 mt-4">
            <ProfileCompletionBar
              profileData={profileData}
              extendedProfile={extendedProfile}
              studentProfile={studentProfile}
              onItemClick={(tab) => {
                setSettingsInitialTab(tab);
                setIsSettingsModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Two Column Layout for Interests/Affiliations and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 mt-6">
          {/* Sidebar - Interests & Startups */}
          <div className="lg:col-span-1 space-y-4">
            {/* Interests Card */}
            {(extendedProfile?.interests?.length || studentProfile?.skills?.length) && (
              <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                <ProfileInterests interests={extendedProfile?.interests} skills={studentProfile?.skills} />
              </div>
            )}

            {/* Clubs Card */}
            {clubs.length > 0 && (
              <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Clubs & Organizations</span>
                </div>
                <div className="space-y-2">
                  {clubs.map((club) => (
                    <div
                      key={club.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{club.name}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          {(club.role === 'admin' || club.role === 'owner') && (
                            <Shield className="w-3 h-3 text-amber-500" />
                          )}
                          {club.role || 'Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Startups Card */}
            {startups.length > 0 && (
              <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Startups</span>
                </div>
                <div className="space-y-2">
                  {startups.map((startup) => (
                    <div
                      key={startup.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt={startup.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Rocket className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{startup.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{startup.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Posts/Media */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="posts">
              <TabsList className="w-full grid grid-cols-2 bg-card/50 border border-border/50 rounded-xl p-1">
                <TabsTrigger value="posts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Posts</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>Media</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4 space-y-4">
                {transformedPosts.length > 0 ? (
                  transformedPosts.map((post) => (
                    <div key={post.id} className="relative">
                      {post.is_pinned && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-b border-border/50">
                          <Pin className="w-3 h-3" />
                          <span>Pinned post</span>
                        </div>
                      )}
                      <PostCard 
                        post={post} 
                        onPin={isOwnProfile ? handlePinPost : undefined}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-card/30 rounded-xl border border-border/30">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No posts yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media" className="mt-4">
                {transformedMediaPosts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {transformedMediaPosts.map((post) => (
                      <div key={post.id} className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/30 hover:border-primary/50 transition-all cursor-pointer">
                        <img
                          src={post.image_url || post.image_urls?.[0]}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card/30 rounded-xl border border-border/30">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No media posts yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
        onBannerChange={(url, height) => {
          setBannerUrl(url);
          setBannerHeight(height);
        }}
        bannerUrl={bannerUrl}
        bannerHeight={bannerHeight}
      />

      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
        initialTab={settingsInitialTab}
      />
    </Layout>
  );
}