import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Eye, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ImageDisplayComponent from "@/components/post/ImageDisplayComponent";
import { useAdvertisingPostViews } from "@/hooks/useAdvertisingPostViews";

interface AdvertisingPost {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  image_thumbnail_url?: string;
  image_medium_url?: string;
  image_original_url?: string;
  redirect_url: string;
  click_count: number;
  likes_count: number;
  views_count: number;
  created_at: string;
  company_id: string;
  company_profiles?: {
    company_name: string;
    logo_url?: string;
  };
}

export default function AdvertisingPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { recordAdvertisingPostView } = useAdvertisingPostViews();

  const [post, setPost] = useState<AdvertisingPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (postId) {
      fetchPost();
      checkIfLiked();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("advertising_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError("Ad post not found");
        return;
      }

      // Fetch company profile separately
      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("company_name, logo_url")
        .eq("user_id", data.company_id)
        .maybeSingle();

      const postWithCompany: AdvertisingPost = {
        ...data,
        company_profiles: companyData || undefined
      };

      setPost(postWithCompany);
      setLikesCount(data.likes_count || 0);
      
      // Record view
      recordAdvertisingPostView(data.id);
    } catch (err) {
      console.error("Error loading ad post:", err);
      setError("Failed to load ad post");
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !postId) return;
    
    const { data } = await supabase
      .from("advertising_likes")
      .select("id")
      .eq("advertising_post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    setLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("advertising_likes")
          .delete()
          .eq("advertising_post_id", post!.id)
          .eq("user_id", user.id);
        
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from("advertising_likes")
          .insert({
            advertising_post_id: post!.id,
            user_id: user.id
          });
        
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVisitSite = async () => {
    if (!post) return;
    
    try {
      await supabase
        .from("advertising_clicks")
        .insert({
          advertising_post_id: post.id,
          user_id: user?.id || null,
          user_agent: navigator.userAgent
        });

      window.open(post.redirect_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error tracking click:", error);
      window.open(post.redirect_url, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
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
          <p className="text-muted-foreground">{error || "Ad post not found"}</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  const companyName = post.company_profiles?.company_name || "Company";
  const companyLogo = post.company_profiles?.logo_url;

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      <div className="max-w-2xl mx-auto pt-6 px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Ad Post Card */}
        <div className="w-full p-4 space-y-3 border-b border-border">
          {/* Header */}
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {companyName.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">{companyName}</p>
                <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs">
                  Ad
                </Badge>
                <span className="text-sm text-muted-foreground">· {formatDate(post.created_at)}</span>
              </div>

              <div className="mt-1">
                <h3 className="font-medium text-foreground mb-1">{post.title}</h3>
                {post.description && (
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {post.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Image - Uses ImageDisplayComponent with built-in modal */}
          <div className="flex justify-center">
            <ImageDisplayComponent
              imageUrl={post.image_original_url || post.image_medium_url || post.image_url}
              alt={post.title}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center gap-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-2 hover:bg-muted/50 ${
                  liked ? "text-red-500 hover:text-red-600" : ""
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                <span className="font-medium">{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleVisitSite}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Visit Site</span>
              </Button>

              {post.views_count > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.views_count} views</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
