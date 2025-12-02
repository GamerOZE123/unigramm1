import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/post/PostCard";
import NewCommentSection from "@/components/post/NewCommentSection";
import RightSidebar from "@/components/layout/RightSidebar";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* ⭐ Now PostCard receives poll & survey fields */}
        <PostCard post={post} />

        <NewCommentSection postId={post.id} />
      </div>

      <RightSidebar />
    </Layout>
  );
}
