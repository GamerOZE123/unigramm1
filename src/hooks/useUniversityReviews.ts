import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UniversityReview {
  id: string;
  user_id: string;
  university: string;
  major: string | null;
  graduation_year: number | null;
  review_text: string;
  rating: number | null;
  helpful_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CreateReviewData {
  university: string;
  major?: string;
  graduation_year?: number;
  review_text: string;
  rating?: number;
}

export const useUniversityReviews = (university?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<UniversityReview[]>([]);
  const [userReview, setUserReview] = useState<UniversityReview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!university) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('university_reviews')
        .select(`
          *,
          profile:profiles!university_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('university', university)
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedData = (data || []).map(review => ({
        ...review,
        profile: Array.isArray(review.profile) ? review.profile[0] : review.profile,
      }));

      setReviews(transformedData);

      // Find user's review if logged in
      if (user) {
        const myReview = transformedData.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: CreateReviewData) => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('university_reviews')
        .insert({
          user_id: user.id,
          ...reviewData,
        })
        .select()
        .single();

      if (error) throw error;

      setUserReview(data);
      await fetchReviews();
      toast.success('Review submitted successfully!');
      return true;
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast.error(error.message || 'Failed to submit review');
      return false;
    }
  };

  const updateReview = async (reviewId: string, reviewData: Partial<CreateReviewData>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('university_reviews')
        .update(reviewData)
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReviews();
      toast.success('Review updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(error.message || 'Failed to update review');
      return false;
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      // Get current helpful count
      const { data: review, error: fetchError } = await supabase
        .from('university_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();

      if (fetchError) throw fetchError;

      // Increment helpful count
      const { error } = await supabase
        .from('university_reviews')
        .update({ helpful_count: (review?.helpful_count || 0) + 1 })
        .eq('id', reviewId);

      if (error) throw error;

      await fetchReviews();
      toast.success('Marked as helpful!');
    } catch (error: any) {
      console.error('Error marking helpful:', error);
      toast.error('Failed to mark as helpful');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [university, user]);

  return {
    reviews,
    userReview,
    loading,
    createReview,
    updateReview,
    markHelpful,
    refetch: fetchReviews,
  };
};

export default useUniversityReviews;
