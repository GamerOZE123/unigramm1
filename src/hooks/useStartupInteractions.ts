import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useStartupInteractions = (startupId?: string) => {
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (startupId) {
      checkInteractionStatus();
      fetchInterestCount();
    }
  }, [startupId, user]);

  const checkInteractionStatus = async () => {
    if (!user || !startupId) return;

    try {
      // Check interest status
      const { data: interestData } = await supabase
        .from('startup_interests')
        .select('id')
        .eq('startup_id', startupId)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsInterested(!!interestData);

      // Check favorite status
      const { data: favoriteData } = await supabase
        .from('item_favorites')
        .select('id')
        .eq('item_id', startupId)
        .eq('item_type', 'startup')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsFavorited(!!favoriteData);
    } catch (error) {
      console.error('Error checking interaction status:', error);
    }
  };

  const fetchInterestCount = async () => {
    if (!startupId) return;

    try {
      const { count } = await supabase
        .from('startup_interests')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startupId);

      setInterestCount(count || 0);
    } catch (error) {
      console.error('Error fetching interest count:', error);
    }
  };

  const toggleInterest = async () => {
    if (!user || !startupId || loading) return;

    setLoading(true);
    try {
      if (isInterested) {
        await supabase
          .from('startup_interests')
          .delete()
          .eq('startup_id', startupId)
          .eq('user_id', user.id);

        setIsInterested(false);
        setInterestCount(prev => Math.max(0, prev - 1));
        toast.success('Removed interest');
      } else {
        await supabase
          .from('startup_interests')
          .insert({ startup_id: startupId, user_id: user.id });

        setIsInterested(true);
        setInterestCount(prev => prev + 1);
        toast.success('Marked as interested!');
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast.error('Failed to update interest');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !startupId || loading) return;

    setLoading(true);
    try {
      if (isFavorited) {
        await supabase
          .from('item_favorites')
          .delete()
          .eq('item_id', startupId)
          .eq('item_type', 'startup')
          .eq('user_id', user.id);

        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('item_favorites')
          .insert({ item_id: startupId, item_type: 'startup', user_id: user.id });

        setIsFavorited(true);
        toast.success('Added to favorites!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  return {
    isInterested,
    isFavorited,
    interestCount,
    loading,
    toggleInterest,
    toggleFavorite
  };
};
