import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUniversityReviews } from '@/hooks/useUniversityReviews';

interface UniversityReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UniversityReviewModal = ({ open, onClose, onSuccess }: UniversityReviewModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ 
    university: string; 
    major: string | null; 
    expected_graduation_year: number | null 
  } | null>(null);

  const { userReview, createReview, updateReview } = useUniversityReviews(profile?.university);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('university, major, expected_graduation_year')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating || 0);
      setReviewText(userReview.review_text);
    }
  }, [userReview]);

  const handleSubmit = async () => {
    if (!profile?.university) return;
    if (reviewText.length < 50) {
      return;
    }

    setLoading(true);

    const reviewData = {
      university: profile.university,
      major: profile.major || undefined,
      graduation_year: profile.expected_graduation_year || undefined,
      review_text: reviewText,
      rating: rating > 0 ? rating : undefined,
    };

    let success = false;
    if (userReview) {
      success = await updateReview(userReview.id, reviewData);
    } else {
      success = await createReview(reviewData);
    }

    setLoading(false);

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hoverRating || rating) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {userReview ? 'Edit Your Review' : 'Review Your University'}
          </DialogTitle>
          <DialogDescription>
            Share your experience to help future students at {profile?.university || 'your university'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Your Rating (Optional)</Label>
            <div className="flex items-center gap-4">
              {renderStars()}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review *</Label>
            <Textarea
              id="review"
              placeholder="Share your experience about the academics, campus life, faculty, opportunities, and overall environment..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 50 characters</span>
              <span className={cn(reviewText.length < 50 ? 'text-destructive' : 'text-green-600')}>
                {reviewText.length}/50+
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Tips for a helpful review:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Share specific experiences and examples</li>
              <li>Be honest but constructive</li>
              <li>Mention what you liked and areas for improvement</li>
              <li>Help prospective students understand campus life</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={reviewText.length < 50 || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              userReview ? 'Update Review' : 'Submit Review'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversityReviewModal;
