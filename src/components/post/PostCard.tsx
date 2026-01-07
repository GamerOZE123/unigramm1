import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostActions from "./PostActions";
import EditPostModal from "./EditPostModal";
import ClickablePostCard from "./ClickablePostCard";
import MultipleImageDisplay from "./MultipleImageDisplay";
import InlineCommentSection from "./InlineCommentSection";
import PollDisplay from "./PollDisplay";
import SurveyDisplay from "./SurveyDisplay";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLikes } from "@/hooks/useLikes";
import { usePostViews } from "@/hooks/usePostViews";
import { useViewportTracker } from "@/hooks/useViewportTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  hashtags?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id?: string;
  user_name?: string;
  user_username?: string;
  user_avatar?: string;
  is_pinned?: boolean;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  startup_id?: string;
  startup?: {
    title: string;
  };
  poll_question?: string;
  poll_options?: any;
  poll_ends_at?: string;
  survey_questions?: any;
}

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onPostUpdated?: () => void;
  onHashtagClick?: (hashtag: string) => void;
  onPin?: (postId: string, currentlyPinned: boolean) => void;
}

export default function PostCard({ post, onLike, onComment, onShare, onPostUpdated, onHashtagClick, onPin }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { isLiked, likesCount, loading: likesLoading, toggleLike } = useLikes(post.id);
  const { recordPostView } = usePostViews();

  // Track when post enters viewport to record view
  const postRef = useViewportTracker(() => {
    recordPostView(post.id);
  });

  const handleHashtagClickInternal = (hashtag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    } else {
      navigate(`/explore?hashtag=${hashtag}`);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
    // Don't call onPostUpdated here to prevent page refresh
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments((prev) => !prev);
  };

  const handleShareClick = () => {
    onShare?.();
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);

      if (error) {
        console.error("Error deleting post:", error);
        throw error;
      }

      toast.success("Post deleted successfully!");
      // ✅ UPGRADE 2: No full refresh - delete handled by realtime subscription
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  // Extract user info
  const username = post.profiles?.username || post.user_username || "user";
  const fullName = post.profiles?.full_name || post.user_name || "Anonymous User";
  const avatarUrl = post.profiles?.avatar_url || post.user_avatar;
  const isOwnPost = user?.id === post.user_id;

  const handlePinClick = () => {
    onPin?.(post.id, post.is_pinned ?? false);
  };

  return (
    <>
      <ClickablePostCard postId={post.id}>
        <div ref={postRef} className="w-full p-4 space-y-3 hover:bg-muted/20 transition-colors border-b border-border">
          {/* Header (with caption inside) */}
          <PostHeader
            username={username}
            fullName={fullName}
            avatarUrl={avatarUrl}
            createdAt={post.created_at}
            content={post.content}
            isOwnPost={isOwnPost}
            onEdit={() => setShowEditModal(true)}
            onDelete={handleDeletePost}
            onPin={handlePinClick}
            isPinned={post.is_pinned}
            userId={post.user_id}
            hashtags={post.hashtags}
            onHashtagClick={handleHashtagClickInternal}
            startupId={post.startup_id}
            startupTitle={post.startup?.title}
          />

          {/* Images (single or multiple) with hashtags overlay */}
          {(post.image_urls?.length > 0 || post.image_url) && (
            <div className="flex justify-center w-full">
              {post.image_urls?.length > 0 ? (
                <MultipleImageDisplay
                  imageUrls={post.image_urls}
                  hashtags={post.hashtags}
                  onHashtagClick={handleHashtagClickInternal}
                  onLike={handleLikeClick}
                  onComment={handleCommentClick}
                  onShare={handleShareClick}
                  isLiked={isLiked}
                  likesCount={likesCount}
                  commentsCount={post.comments_count}
                  postId={post.id}
                  postContent={post.content}
                />
              ) : post.image_url ? (
                <PostContent
                  content=""
                  imageUrl={post.image_url}
                  hashtags={post.hashtags}
                  onHashtagClick={handleHashtagClickInternal}
                  onLike={handleLikeClick}
                  onComment={handleCommentClick}
                  onShare={handleShareClick}
                  isLiked={isLiked}
                  likesCount={likesCount}
                  commentsCount={post.comments_count}
                  postId={post.id}
                  postContent={post.content}
                />
              ) : null}
            </div>
          )}

          {/* Poll Display */}
          {post.poll_question && post.poll_options && (
            <PollDisplay
              postId={post.id}
              question={post.poll_question}
              options={post.poll_options}
              endsAt={post.poll_ends_at}
            />
          )}

          {post.survey_questions && <SurveyDisplay questions={post.survey_questions} />}

          {/* Actions */}
          <PostActions
            likesCount={likesCount}
            commentsCount={post.comments_count}
            viewsCount={post.views_count}
            isLiked={isLiked}
            likesLoading={likesLoading}
            onLike={handleLikeClick}
            onComment={handleCommentClick}
            onShare={onShare}
            postId={post.id}
            postContent={post.content}
          />

          {/* Inline Comments Section */}
          {showComments && <InlineCommentSection postId={post.id} initialCommentsCount={post.comments_count} />}
        </div>
      </ClickablePostCard>

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={() => {
            // ✅ UPGRADE 2: No full refresh - update handled by realtime subscription
            setShowEditModal(false);
          }}
          post={{
            id: post.id,
            content: post.content,
            hashtags: post.hashtags,
            image_urls: post.image_urls || (post.image_url ? [post.image_url] : []),
          }}
        />
      )}
    </>
  );
}
