import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink, TrendingUp, MoreHorizontal, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageDisplayComponent from '@/components/post/ImageDisplayComponent';
import { useAdvertisingPostViews } from '@/hooks/useAdvertisingPostViews';
import { useViewportTracker } from '@/hooks/useViewportTracker';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface AdvertisingPostCardProps {
  post: AdvertisingPost;
  onLikeUpdate?: () => void;
  isLiked?: boolean;
  showDetailModal?: boolean;
}

export default function AdvertisingPostCard({ 
  post, 
  onLikeUpdate,
  isLiked = false,
}: AdvertisingPostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const { recordAdvertisingPostView } = useAdvertisingPostViews();
  
  // Track when ad enters viewport to record view
  const adRef = useViewportTracker(() => {
    recordAdvertisingPostView(post.id);
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleCardClick = () => {
    // Navigate to the ad post detail page (like regular posts)
    navigate(`/ad/${post.id}`);
  };

  const handleVisitSite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Track the click
      await supabase
        .from('advertising_clicks')
        .insert({
          advertising_post_id: post.id,
          user_id: user?.id || null,
          ip_address: null,
          user_agent: navigator.userAgent
        });

      // Open the URL in a new tab
      window.open(post.redirect_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still redirect even if tracking fails
      window.open(post.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
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
        // Unlike
        await supabase
          .from('advertising_likes')
          .delete()
          .eq('advertising_post_id', post.id)
          .eq('user_id', user.id);
        
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from('advertising_likes')
          .insert({
            advertising_post_id: post.id,
            user_id: user.id
          });
        
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }

      onLikeUpdate?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Extract company info
  const companyName = post.company_profiles?.company_name || 'Company';
  const companyLogo = post.company_profiles?.logo_url;
  const isOwnAd = user?.id === post.company_id;

  return (
    <div 
      ref={adRef}
      className="cursor-pointer hover:bg-muted/20 transition-colors overflow-hidden group w-full p-4 space-y-3 border-b border-border"
      onClick={handleCardClick}
    >
      {/* Header - Similar to PostHeader */}
      <div className="flex gap-3">
        {/* Company Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">
              {companyName.charAt(0)}
            </span>
          )}
        </div>

        {/* Right section */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {/* Company info */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">
                {companyName}
              </p>
              <Badge 
                variant="secondary" 
                className="bg-primary/90 text-primary-foreground text-xs"
              >
                Ad
              </Badge>
              <span className="text-sm text-muted-foreground">· {formatDate(post.created_at)}</span>
            </div>

            {/* Dropdown actions - only show for own ads */}
            {isOwnAd && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    Edit Ad
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Ad
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Title and Description as Caption */}
          <div className="mt-1">
            <h3 className="font-medium text-foreground mb-1">
              {post.title}
            </h3>
            {post.description && (
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image - Uses ImageDisplayComponent with built-in modal (like regular posts) */}
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <ImageDisplayComponent 
          imageUrl={post.image_medium_url || post.image_url}
          alt={post.title}
        />
      </div>

      {/* Actions - Similar to PostActions */}
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
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/ad/${post.id}`);
            }}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">{post.click_count}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleVisitSite}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Visit</span>
          </Button>

          {/* Views Count */}
          {post.views_count > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">{post.views_count} views</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
