
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hash, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTrendingUniversityPosts } from '@/hooks/useTrendingUniversityPosts';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RandomUser {
  user_id: string;
  full_name?: string;
  username?: string;
  university?: string;
  major?: string;
  avatar_url?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  location?: string;
  club_id: string;
  clubs_profiles?: {
    club_name: string;
    logo_url: string | null;
  };
}

export default function RightSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [randomUsers, setRandomUsers] = useState<RandomUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { hashtags: trendingHashtags, loading: loadingTrending } = useTrendingUniversityPosts(5);

  useEffect(() => {
    fetchRandomUsers();
    fetchUpcomingEvents();
  }, [user]);

  const fetchUpcomingEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('club_events')
        .select('id, title, event_date, event_time, location, club_id, clubs_profiles(club_name, logo_url)')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRandomUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, university, major, avatar_url, user_type')
        .neq('user_id', user.id)
        .eq('user_type', 'student')
        .limit(20);
      
      if (error) throw error;
      
      // Shuffle the array to get random users
      const shuffled = (data || []).sort(() => 0.5 - Math.random());
      setRandomUsers(shuffled.slice(0, 3));
    } catch (error) {
      console.error('Error fetching random users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Set up real-time subscription for avatar updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-avatars')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=in.(${randomUsers.map(u => u.user_id).join(',')})`
        },
        (payload) => {
          setRandomUsers(prevUsers =>
            prevUsers.map(u =>
              u.user_id === payload.new.user_id
                ? { ...u, avatar_url: payload.new.avatar_url }
                : u
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, randomUsers.map(u => u.user_id).join(',')]);


  const handleUserClick = (username: string) => {
    navigate(`/${username}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/explore?hashtag=${hashtag}`);
  };

  return (
    <aside className="hidden xl:block fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] overflow-y-auto bg-background border-l border-border p-6 space-y-6">
      {/* Upcoming Events */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Upcoming Events</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary hover:text-primary/80"
            onClick={() => navigate('/explore?view=events')}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {loadingEvents ? (
            <div className="text-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-2">No upcoming events</p>
          ) : (
            upcomingEvents.map((event) => (
              <div 
                key={event.id} 
                className="p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer border border-border/50"
                onClick={() => navigate('/explore?view=events')}
              >
                <div className="flex items-start gap-3">
                  {event.clubs_profiles && (
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={event.clubs_profiles.logo_url || ''} />
                      <AvatarFallback className="text-xs">
                        {event.clubs_profiles.club_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.event_date), 'MMM dd, yyyy')}
                      {event.event_time && ` · ${event.event_time}`}
                    </p>
                    {event.clubs_profiles?.club_name && (
                      <p className="text-xs text-primary mt-1">{event.clubs_profiles.club_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Random Users */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">People you may know</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary hover:text-primary/80"
            onClick={fetchRandomUsers}
          >
            Refresh
          </Button>
        </div>
        <div className="space-y-3">
          {loadingUsers ? (
            <div className="text-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : randomUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-2">No users found</p>
          ) : (
            randomUsers.map((randomUser) => (
              <div 
                key={randomUser.user_id} 
                className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/20 transition-colors"
                onClick={() => handleUserClick(randomUser.username || '')}
              >
                {randomUser.avatar_url ? (
                  <img 
                    src={randomUser.avatar_url} 
                    alt={randomUser.full_name || randomUser.username || 'User'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {randomUser.full_name?.charAt(0) || randomUser.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {randomUser.full_name || randomUser.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {randomUser.university || randomUser.major || 'Student'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Hashtags in University */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Trending in Your University</h3>
        </div>
        {loadingTrending ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : trendingHashtags.length === 0 ? (
          <p className="text-muted-foreground text-sm">No trending hashtags in your university yet</p>
        ) : (
          <div className="space-y-3">
            {trendingHashtags.map((tag, index) => (
              <div 
                key={tag.hashtag} 
                className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-muted/20 transition-colors"
                onClick={() => handleHashtagClick(tag.hashtag)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{tag.hashtag}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{tag.post_count}</div>
                  <div className="text-xs text-muted-foreground">posts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}