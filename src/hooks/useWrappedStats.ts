import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WrappedStats {
  timeOnPlatform: {
    years: number;
    months: number;
    days: number;
  };
  messagesSent: number;
  connections: number;
  startupsFollowed: number;
  clubsJoined: number;
  postsCreated: number;
  commentsWritten: number;
  likesReceived: number;
  mostDMedPerson: {
    name: string;
    messageCount: number;
  } | null;
  postingBehavior: {
    social: number;
    career: number;
    clubs: number;
  };
  university: string;
  major: string;
  graduationYear: number;
}

export const useWrappedStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, university, major, expected_graduation_year')
        .eq('user_id', user.id)
        .single();

      // Calculate time on platform
      const joinDate = new Date(profile?.created_at || Date.now());
      const now = new Date();
      const diffMs = now.getTime() - joinDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;

      // Get messages count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id);

      // Get connections (follows)
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      // Get clubs joined
      const { count: clubsCount } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get posts created
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get comments written
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get likes received on user's posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);

      let likesReceived = 0;
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds);
        likesReceived = likesCount || 0;
      }

      // Get startup interactions - count from startup_contributors as a proxy
      let startupCount = 0;
      try {
        const { count } = await supabase
          .from('startup_contributors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        startupCount = count || 0;
      } catch (e) {
        // Table might not exist
      }

      // Get most DMed person
      const { data: messageStats } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('sender_id', user.id);

      let mostDMedPerson = null;
      if (messageStats && messageStats.length > 0) {
        // Count messages per conversation
        const conversationCounts: Record<string, number> = {};
        messageStats.forEach(m => {
          conversationCounts[m.conversation_id] = (conversationCounts[m.conversation_id] || 0) + 1;
        });
        
        // Find the most messaged conversation
        const topConversation = Object.entries(conversationCounts)
          .sort(([, a], [, b]) => b - a)[0];

        if (topConversation) {
          const { data: conversation } = await supabase
            .from('conversations')
            .select('user1_id, user2_id')
            .eq('id', topConversation[0])
            .single();

          if (conversation) {
            const otherUserId = conversation.user1_id === user.id 
              ? conversation.user2_id 
              : conversation.user1_id;

            if (otherUserId) {
              const { data: otherUser } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', otherUserId)
                .single();

              if (otherUser) {
                mostDMedPerson = {
                  name: otherUser.full_name || 'A friend',
                  messageCount: topConversation[1],
                };
              }
            }
          }
        }
      }

      setStats({
        timeOnPlatform: { years, months, days },
        messagesSent: messageCount || 0,
        connections: followingCount || 0,
        startupsFollowed: startupCount || 0,
        clubsJoined: clubsCount || 0,
        postsCreated: postsCount || 0,
        commentsWritten: commentsCount || 0,
        likesReceived,
        mostDMedPerson,
        postingBehavior: {
          social: 40,
          career: 35,
          clubs: 25,
        },
        university: profile?.university || 'Your University',
        major: profile?.major || 'Your Major',
        graduationYear: profile?.expected_graduation_year || new Date().getFullYear(),
      });
    } catch (error) {
      console.error('Error fetching wrapped stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, loading, refetch: fetchStats };
};

export default useWrappedStats;
