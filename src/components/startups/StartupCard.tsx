import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Star, 
  Globe, 
  Mail, 
  Linkedin, 
  Edit, 
  Trash2,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StartupProfile {
  full_name: string;
  username: string;
  avatar_url?: string;
  university?: string;
  linkedin_url?: string;
}

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  slug: string | null;
  looking_for: string[];
  website_url?: string;
  contact_email?: string;
  created_at: string;
  profiles: StartupProfile;
}

interface StartupCardProps {
  startup: Startup;
  onEdit?: (startup: Startup, e: React.MouseEvent) => void;
  onDelete?: (startupId: string, e: React.MouseEvent) => void;
}

export default function StartupCard({ startup, onEdit, onDelete }: StartupCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkInteractionStatus();
    fetchInterestCount();
  }, [startup.id, user]);

  const checkInteractionStatus = async () => {
    if (!user) return;

    try {
      const [interestRes, favoriteRes] = await Promise.all([
        supabase
          .from('startup_interests')
          .select('id')
          .eq('startup_id', startup.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('item_favorites')
          .select('id')
          .eq('item_id', startup.id)
          .eq('item_type', 'startup')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      setIsInterested(!!interestRes.data);
      setIsFavorited(!!favoriteRes.data);
    } catch (error) {
      console.error('Error checking interaction status:', error);
    }
  };

  const fetchInterestCount = async () => {
    try {
      const { count } = await supabase
        .from('startup_interests')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startup.id);

      setInterestCount(count || 0);
    } catch (error) {
      console.error('Error fetching interest count:', error);
    }
  };

  const handleToggleInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) {
      if (!user) toast.error('Please login to show interest');
      return;
    }

    setLoading(true);
    try {
      if (isInterested) {
        await supabase
          .from('startup_interests')
          .delete()
          .eq('startup_id', startup.id)
          .eq('user_id', user.id);

        setIsInterested(false);
        setInterestCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('startup_interests')
          .insert({ startup_id: startup.id, user_id: user.id });

        setIsInterested(true);
        setInterestCount(prev => prev + 1);
        toast.success('Marked as interested!');
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) {
      if (!user) toast.error('Please login to favorite');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await supabase
          .from('item_favorites')
          .delete()
          .eq('item_id', startup.id)
          .eq('item_type', 'startup')
          .eq('user_id', user.id);

        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('item_favorites')
          .insert({ item_id: startup.id, item_type: 'startup', user_id: user.id });

        setIsFavorited(true);
        toast.success('Added to favorites!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      mvp: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      launched: 'bg-green-500/10 text-green-500 border-green-500/20',
      growing: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };
    return colors[stage] || colors.idea;
  };

  const isOwner = user?.id === startup.user_id;

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/startup/${startup.slug || startup.id}`)}
    >
      {/* Top action buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
            isInterested && "text-pink-500 hover:text-pink-600"
          )}
          onClick={handleToggleInterest}
          disabled={loading}
        >
          <Heart className={cn("w-4 h-4", isInterested && "fill-current")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
            isFavorited && "text-yellow-500 hover:text-yellow-600"
          )}
          onClick={handleToggleFavorite}
          disabled={loading}
        >
          <Star className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </Button>
      </div>

      {/* Stage badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className={cn("text-xs font-medium border", getStageColor(startup.stage))}>
          {startup.stage.toUpperCase()}
        </Badge>
      </div>

      <div className="p-5 pt-12">
        {/* Header with Avatar and Title */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar
            className="h-12 w-12 ring-2 ring-background shadow-md cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${startup.profiles?.username || ''}`);
            }}
          >
            <AvatarImage src={startup.profiles?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {startup.profiles?.full_name?.[0] || startup.profiles?.username?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {startup.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              by {startup.profiles?.full_name || startup.profiles?.username}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {startup.description}
        </p>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="secondary" className="text-xs">
            {startup.category}
          </Badge>
          {startup.profiles?.university && (
            <Badge variant="outline" className="text-xs">
              {startup.profiles.university}
            </Badge>
          )}
        </div>

        {/* Looking For Section */}
        {startup.looking_for && startup.looking_for.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Users className="w-3 h-3" />
              <span>Looking for</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {startup.looking_for.slice(0, 3).map((item, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs bg-primary/5 border-primary/20 text-primary"
                >
                  {item}
                </Badge>
              ))}
              {startup.looking_for.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{startup.looking_for.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Interest Count & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {interestCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                {interestCount} interested
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {isOwner && onEdit && onDelete && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => onEdit(startup, e)}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => onDelete(startup.id, e)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/startup/${startup.slug || startup.id}`);
              }}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
