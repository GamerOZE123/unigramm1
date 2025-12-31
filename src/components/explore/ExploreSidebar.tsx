import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { useUsers } from '@/hooks/useUsers';
import { Hash, TrendingUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface ExploreSidebarProps {
  onHashtagClick?: (hashtag: string) => void;
}

export default function ExploreSidebar({ onHashtagClick }: ExploreSidebarProps) {
  const { hashtags, loading: hashtagsLoading } = useTrendingHashtags();
  const { users, loading: usersLoading } = useUsers();
  const navigate = useNavigate();

  const suggestedUsers = users.slice(0, 5);

  return (
    <div className="space-y-6 sticky top-6">
      {/* Trending Hashtags */}
      <Card className="p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Trending Hashtags</h3>
        </div>
        <div className="space-y-3">
          {hashtagsLoading ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : hashtags.length > 0 ? (
            hashtags.map((item) => (
              <button
                key={item.hashtag}
                onClick={() => onHashtagClick?.(item.hashtag)}
                className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.hashtag}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.post_count} posts</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No trending hashtags</p>
          )}
        </div>
      </Card>

      {/* Suggested Users */}
      <Card className="p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Suggested Users</h3>
        </div>
        <div className="space-y-3">
          {usersLoading ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => navigate(`/${user.username}`)}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No suggestions</p>
          )}
        </div>
      </Card>
    </div>
  );
}
