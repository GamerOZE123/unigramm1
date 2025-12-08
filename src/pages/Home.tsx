import React from "react";
import Layout from "@/components/layout/Layout";
import PostCard from "@/components/post/PostCard";
import AdvertisingPostCard from "@/components/advertising/AdvertisingPostCard";
import ImageUploadButton from "@/components/post/ImageUploadButton";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useHomePosts,
  TransformedPost,
  AdvertisingPost,
} from "@/hooks/useHomePosts";

// Re-export types for backwards compatibility
export type { TransformedPost } from "@/hooks/useHomePosts";

export default function Home() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const {
    mixedPosts,
    loading,
    loadingMore,
    viewMode,
    newPostsAvailable,
    pendingNewPosts,
    switchViewMode,
    loadNewPosts,
  } = useHomePosts(user);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pt-2">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      <div className="max-w-xl mx-auto pt-6 -mt-4 md:pt-2 md:-mt-6">
        {/* Global/University Toggle */}
        <div className="flex justify-center gap-4 py-4 mb-4 sticky top-0 bg-background z-10 border-b border-border">
          <button
            onClick={() => switchViewMode("global")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              viewMode === "global"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => switchViewMode("university")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              viewMode === "university"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            University
          </button>
        </div>

        {/* New posts available banner */}
        {newPostsAvailable && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-primary">
              {pendingNewPosts.length} new{" "}
              {pendingNewPosts.length === 1 ? "post" : "posts"} available
            </span>
            <button
              onClick={loadNewPosts}
              className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Load new posts
            </button>
          </div>
        )}

        <div className="space-y-4">
          {mixedPosts.length > 0 ? (
            mixedPosts.map((mixedPost) =>
              mixedPost.type === "regular" ? (
                <PostCard
                  key={`regular-${mixedPost.data.id}`}
                  post={mixedPost.data as TransformedPost}
                />
              ) : (
                <AdvertisingPostCard
                  key={`ad-${mixedPost.data.id}`}
                  post={mixedPost.data as AdvertisingPost}
                />
              )
            )
          ) : (
            <div className="post-card text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to the Community!
              </h3>
              <p className="text-muted-foreground mb-4">
                No posts yet. Be the first to share something with your
                community!
              </p>
              <p className="text-sm text-muted-foreground">
                Click the + button below to create your first post.
              </p>
            </div>
          )}

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <ImageUploadButton onPostCreated={() => {}} />
    </Layout>
  );
}
