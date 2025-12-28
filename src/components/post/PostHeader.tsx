import React from 'react';
import { MoreHorizontal, Edit, Trash, CheckCircle2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostHeaderProps {
  username: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  content: string; // caption
  isVerified?: boolean;
  isOwnPost?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  userId?: string; // Add userId for profile navigation
  hashtags?: string[];
  onHashtagClick?: (hashtag: string, e: React.MouseEvent) => void;
  startupId?: string;
  startupTitle?: string;
}

export default function PostHeader({ 
  username, 
  fullName, 
  avatarUrl, 
  createdAt, 
  content,
  isVerified = false,
  isOwnPost = false, 
  onEdit, 
  onDelete,
  userId,
  hashtags,
  onHashtagClick,
  startupId,
  startupTitle
}: PostHeaderProps) {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/${username}`);
    }
  };

  const displayName = fullName || username;
  const displayUsername = username;
  const displayAvatar = avatarUrl;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center transition-opacity cursor-pointer hover:opacity-90"
        onClick={handleProfileClick}
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">
            {displayName?.charAt(0) || 'U'}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          {/* User info */}
          <div className="flex items-center gap-2 flex-wrap">
            <p 
              className="font-semibold text-foreground cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              {displayName}
            </p>
            {isVerified && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
            <p 
              className="text-sm text-muted-foreground cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              @{displayUsername}
            </p>
            <span className="text-sm text-muted-foreground">· {formatDate(createdAt)}</span>
          </div>

          {/* Dropdown actions */}
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Caption */}
        {content && (
          <p className="text-foreground mt-1 leading-relaxed whitespace-pre-line">
            {content.replace(/#\w+/g, '').trim()}
          </p>
        )}

        {/* Hashtags below caption */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {hashtags.map((hashtag, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onHashtagClick?.(hashtag, e);
                }}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium cursor-pointer transition-colors"
              >
                #{hashtag}
              </button>
            ))}
          </div>
        )}

        {/* Startup Link */}
        {startupId && startupTitle && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/startup/${startupId}`);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full cursor-pointer transition-colors text-sm"
          >
            <Rocket className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-medium">{startupTitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
