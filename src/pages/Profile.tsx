import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/post/PostCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import MessageButton from "@/components/profile/MessageButton";
import FollowButton from "@/components/profile/FollowButton";
import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";
import ProfileInterests from "@/components/profile/ProfileInterests";
import ProfileAffiliations from "@/components/profile/ProfileAffiliations";
import ProfileAbout from "@/components/profile/ProfileAbout";
import ProfileCompletionBar from "@/components/profile/ProfileCompletionBar";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, GraduationCap, MapPin, Image as ImageIcon, FileText, User, Calendar, Sparkles } from "lucide-react";
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
  user_university?: string;
  hashtags?: string[];
  poll_question?: string | null;
  poll_options?: any | null;
  poll_ends_at?: string | null;
  survey_questions?: any | null;
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
          survey_questions
        `
        )
        .eq("user_id", userId)
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
      user_university: post.profiles.university,
      hashtags: post.hashtags || [],
      poll_question: post.poll_question,
      poll_options: post.poll_options,
      poll_ends_at: post.poll_ends_at,
      survey_questions: post.survey_questions,
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
          <div className="relative mx-4 -mt-20 md:-mt-16">
            <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg -mt-16 md:-mt-20">
                    <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={profileData.full_name || profileData.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-primary">
                          {profileData.full_name?.charAt(0) || profileData.username?.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Stats - Below Avatar on Mobile, Hidden on Desktop */}
                  <div className="flex gap-4 mt-4 md:hidden">
                    <div className="text-center">
                      <div className="font-bold text-lg text-foreground">{posts.length}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-foreground">{profileData.followers_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-foreground">{profileData.following_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <h1 className="text-2xl font-bold text-foreground">{profileData.full_name || profileData.username}</h1>
                        {clubs.length > 0 && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">@{profileData.username}</p>
                      
                      {/* Status Message */}
                      {profileData.status_message && (
                        <p className="mt-2 text-sm italic text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg inline-block">
                          "{profileData.status_message}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons - Desktop */}
                    <div className="hidden md:flex gap-2">
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

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                    {(profileData.university || profileData.major || profileData.campus_year) && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span>
                          {[profileData.university, profileData.major, profileData.campus_year && `'${profileData.campus_year.slice(-2)}`]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </div>
                    )}
                    {locationString && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span>{locationString}</span>
                      </div>
                    )}
                    {joinedDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Joined {joinedDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profileData.bio && (
                    <p className="mt-3 text-foreground/80 text-sm leading-relaxed">{profileData.bio}</p>
                  )}

                  {/* Desktop Stats Row */}
                  <div className="hidden md:flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{posts.length}</span>
                      <span className="text-muted-foreground text-sm">Posts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{profileData.followers_count || 0}</span>
                      <span className="text-muted-foreground text-sm">Followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{profileData.following_count || 0}</span>
                      <span className="text-muted-foreground text-sm">Following</span>
                    </div>
                    {clubs.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{clubs.length}</span>
                        <span className="text-muted-foreground text-sm">Clubs</span>
                      </div>
                    )}
                    {startups.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{startups.length}</span>
                        <span className="text-muted-foreground text-sm">Startups</span>
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
          </div>
        </div>

        {/* Profile Completion Bar - Only for own profile */}
        {isOwnProfile && (
          <div className="mx-4 mt-4">
            <ProfileCompletionBar
              profileData={profileData}
              extendedProfile={extendedProfile}
              studentProfile={studentProfile}
            />
          </div>
        )}

        {/* Two Column Layout for Interests/Affiliations and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 mt-6">
          {/* Sidebar - Interests & Affiliations */}
          <div className="lg:col-span-1 space-y-4">
            {/* Interests Card */}
            {(extendedProfile?.interests?.length || studentProfile?.skills?.length) && (
              <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                <ProfileInterests interests={extendedProfile?.interests} skills={studentProfile?.skills} />
              </div>
            )}

            {/* Affiliations Card */}
            {(clubs.length > 0 || startups.length > 0) && (
              <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                <ProfileAffiliations clubs={clubs} startups={startups} />
              </div>
            )}
          </div>

          {/* Main Content - Posts/About/Media */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="posts">
              <TabsList className="w-full grid grid-cols-3 bg-card/50 border border-border/50 rounded-xl p-1">
                <TabsTrigger value="posts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Posts</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="w-4 h-4" />
                  <span>About</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>Media</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4 space-y-4">
                {transformedPosts.length > 0 ? (
                  transformedPosts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-12 bg-card/30 rounded-xl border border-border/30">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No posts yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <ProfileAbout
                  education={studentProfile?.education}
                  workExperience={studentProfile?.work_experience}
                  campusGroups={extendedProfile?.campus_groups}
                  joinedAt={extendedProfile?.created_at}
                  location={locationString}
                  certificates={studentProfile?.certificates}
                />
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
    </Layout>
  );
}