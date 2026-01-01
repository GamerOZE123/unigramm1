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

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, GraduationCap, MapPin, Image as ImageIcon, FileText, User } from "lucide-react";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useProfileData } from "@/hooks/useProfileData";

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

  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className="max-w-2xl mx-auto">
        {/* Banner Section */}
        <div className="relative">
          <div
            className="w-full bg-muted/30 rounded-b-xl overflow-hidden"
            style={{
              aspectRatio: "3/1",
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: `center ${profileData.banner_position || 50}%`,
              position: "relative",
              borderBottomRightRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            {isOwnProfile && (
              <button
                className="absolute top-3 right-3 bg-background/60 text-foreground rounded-full p-2 hover:bg-background/80 transition"
                onClick={() => setIsEditModalOpen(true)}
                aria-label="Edit banner"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center shadow-lg">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.full_name || profileData.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-foreground">
                  {profileData.full_name?.charAt(0) || profileData.username?.charAt(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-12 pb-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">{profileData.full_name || profileData.username}</h1>
          <p className="text-muted-foreground">@{profileData.username}</p>

          {/* Status Message */}
          {profileData.status_message && (
            <p className="mt-2 text-sm italic text-muted-foreground">"{profileData.status_message}"</p>
          )}

          {/* University, Major, Year */}
          {(profileData.university || profileData.major || profileData.campus_year) && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              <span>
                {[profileData.university, profileData.major, profileData.campus_year && `Class of ${profileData.campus_year}`]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
            </div>
          )}

          {/* Location */}
          {locationString && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{locationString}</span>
            </div>
          )}

          {/* Bio */}
          {profileData.bio && <p className="mt-3 text-foreground/80">{profileData.bio}</p>}

          {/* Social Links */}
          <ProfileSocialLinks
            linkedinUrl={extendedProfile?.linkedin_url}
            instagramUrl={extendedProfile?.instagram_url}
            twitterUrl={extendedProfile?.twitter_url}
            websiteUrl={extendedProfile?.website_url}
            githubUrl={studentProfile?.github_url}
            portfolioUrl={studentProfile?.portfolio_url}
          />

          {/* Stats */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg">{posts.length}</div>
              <div className="text-muted-foreground text-sm">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.followers_count || 0}</div>
              <div className="text-muted-foreground text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.following_count || 0}</div>
              <div className="text-muted-foreground text-sm">Following</div>
            </div>
            {clubs.length > 0 && (
              <div className="text-center">
                <div className="font-bold text-lg">{clubs.length}</div>
                <div className="text-muted-foreground text-sm">Clubs</div>
              </div>
            )}
            {startups.length > 0 && (
              <div className="text-center">
                <div className="font-bold text-lg">{startups.length}</div>
                <div className="text-muted-foreground text-sm">Startups</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-4">
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

          {/* Interests & Skills */}
          <ProfileInterests interests={extendedProfile?.interests} skills={studentProfile?.skills} />

          {/* Affiliations */}
          <ProfileAffiliations clubs={clubs} startups={startups} />
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="posts" className="px-4 mt-2">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {transformedPosts.length > 0 ? (
              transformedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">No posts yet</div>
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

          <TabsContent value="media" className="mt-4 space-y-4">
            {transformedMediaPosts.length > 0 ? (
              transformedMediaPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">No media posts yet</div>
            )}
          </TabsContent>
        </Tabs>
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
