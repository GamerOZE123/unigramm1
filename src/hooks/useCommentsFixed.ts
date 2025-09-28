import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface Post {
  id: string;
  title?: string;
  content?: string;
  image_urls?: string[];
  user_id?: string;
  created_at?: string;
  comments_count?: number;
}

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately to avoid type issues
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.user_id === comment.user_id) || {
            full_name: 'Unknown User',
            username: 'unknown',
            avatar_url: null
          }
        }));

        setComments(commentsWithProfiles as Comment[]);
        setCommentsCount(commentsWithProfiles.length);
      } else {
        setComments([]);
        setCommentsCount(0);
      }

      // Update post comments count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments_count: data?.length || 0 })
        .eq('id', postId);

      if (updateError) console.error('Error updating comments count:', updateError);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!user || !content.trim()) return;

    setPosting(true);
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          post_id: postId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Get user profile for the new comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .eq('user_id', user.id)
        .single();

      const newComment: Comment = {
        ...data,
        profiles: profile || {
          full_name: 'You',
          username: 'you',
          avatar_url: null
        }
      };

      setComments(prev => [...prev, newComment]);
      setCommentsCount(prev => prev + 1);
      toast.success('Comment added successfully');

      // Update comments count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments_count: comments.length + 1 })
        .eq('id', postId);

      if (updateError) console.error('Error updating comments count:', updateError);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setPosting(false);
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(prev => Math.max(0, prev - 1));
      toast.success('Comment deleted!');
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  return {
    comments,
    commentsCount,
    loading,
    posting,
    submitting,
    addComment,
    deleteComment,
    refetch: fetchComments,
    refreshComments: fetchComments
  };
};