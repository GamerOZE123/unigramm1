import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/post/PostCard";
import NewCommentSection from "@/components/post/NewCommentSection";
import RightSidebar from "@/components/layout/RightSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp } from "lucide-react";

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

  // ⭐ Add poll + survey fields
  poll_question?: string | null;
  poll_options?: any | null;
  poll_ends_at?: string | null;
  survey_questions?: any | null;

  hashtags?: string[] | null;
}

export default function Post() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<TransformedPost | null>(null);
  const [topPosts, setTopPosts] = useState<{ id: string; image_url?: string; image_urls?: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  const fetchTopEngagedPosts = async (userId: string, currentPostId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`id, user_id, image_url, image_urls, likes_count, comments_count`)
        .eq("user_id", userId)
        .neq("id", currentPostId)
        .is("poll_question", null)
        .is("survey_questions", null)
        .order("likes_count", { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      // Filter to only posts with images
      const postsWithImages = (postsData || []).filter(
        (p) => p.image_url || (p.image_urls && p.image_urls.length > 0)
      ).slice(0, 5);

      setTopPosts(postsWithImages);
    } catch (err) {
      console.error("Error fetching top posts:", err);
    }
  };

  const fetchPost = async () => {
    try {
      // ⭐ Fetch post WITH poll/survey fields
      const { data: postData, error: postError } = await supabase
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
        `,
        )
        .eq("id", postId)
        .single();

      if (postError) throw postError;
      if (!postData) {
        setError("Post not found");
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username, university, avatar_url")
        .eq("user_id", postData.user_id)
        .single();

      const transformedPost: TransformedPost = {
        id: postData.id,
        content: postData.content || "",
        image_url: postData.image_url,
        image_urls: postData.image_urls,
        created_at: postData.created_at,
        likes_count: postData.likes_count || 0,
        comments_count: postData.comments_count || 0,
        views_count: postData.views_count || 0,
        user_id: postData.user_id,
        user_name: profileData?.full_name || profileData?.username || "Anonymous User",
        user_username: profileData?.username || "user",
        user_university: profileData?.university || undefined,

        // ⭐ Add these poll/survey fields
        poll_question: postData.poll_question,
        poll_options: postData.poll_options,
        poll_ends_at: postData.poll_ends_at,
        survey_questions: postData.survey_questions,

        hashtags: postData.hashtags,
      };

      setPost(transformedPost);
      fetchTopEngagedPosts(postData.user_id, postData.id);
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-muted-foreground">{error || "Post not found"}</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      <div className="max-w-2xl mx-auto pt-6 px-4">
        <PostCard post={post} />

        {topPosts.length > 0 && (
          <div className="mt-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">More from {post.user_name}</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {topPosts.map((topPost) => {
                const imageUrl = topPost.image_url || (topPost.image_urls && topPost.image_urls[0]);
                return (
                  <div 
                    key={topPost.id} 
                    onClick={() => navigate(`/post/${topPost.id}`)}
                    className="flex-shrink-0 cursor-pointer rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Post" 
                      className="w-32 h-32 object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <NewCommentSection postId={post.id} />
      </div>

      <RightSidebar />
    </Layout>
  );
}
