import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InterestedUser {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
    university: string;
  };
}

interface TaggedPost {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  image_urls: string[] | null;
  user_id: string;
  is_approved_for_startup: boolean | null;
}

interface StartupRightSidebarProps {
  interestedUsers: InterestedUser[];
  taggedPosts: TaggedPost[];
  isOwner: boolean;
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
}

export default function StartupRightSidebar({
  interestedUsers,
  taggedPosts,
  isOwner,
  onApprovePost,
  onRejectPost,
}: StartupRightSidebarProps) {
  const navigate = useNavigate();

  const approvedPosts = taggedPosts.filter(p => p.is_approved_for_startup === true);
  const pendingPosts = taggedPosts.filter(p => !p.is_approved_for_startup);

  return (
    <div className="space-y-6">
      {/* Interested Users */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Interested ({interestedUsers.length})</h3>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {interestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              onClick={() => navigate(`/${user.profiles.username}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profiles.avatar_url} />
                <AvatarFallback>
                  {user.profiles.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.profiles.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.profiles.university}
                </p>
              </div>
            </div>
          ))}
          {interestedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No interested users yet
            </p>
          )}
        </div>
      </Card>

      {/* Tagged Posts - Pending Approval (Owner Only) */}
      {isOwner && pendingPosts.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Pending Posts ({pendingPosts.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingPosts.map((post) => (
              <div key={post.id} className="border rounded-lg p-3 space-y-2">
                <p className="text-sm line-clamp-3">{post.content}</p>
                {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                  <div className="w-full h-32 rounded overflow-hidden">
                    <img
                      src={post.image_url || post.image_urls![0]}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => onApprovePost(post.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onRejectPost(post.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Featured Posts */}
      {approvedPosts.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Featured Posts ({approvedPosts.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {approvedPosts.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <p className="text-sm line-clamp-2">{post.content}</p>
                {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                  <div className="mt-2 w-full h-24 rounded overflow-hidden">
                    <img
                      src={post.image_url || post.image_urls![0]}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}