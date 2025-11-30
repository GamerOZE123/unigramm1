import React from 'react';
import { MoreHorizontal, Edit, Trash, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGhostMode } from '@/contexts/GhostModeContext';
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
  onHashtagClick
}: PostHeaderProps) {
  const navigate = useNavigate();
  const { isGhostMode } = useGhostMode();
  
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
    if (username && !isGhostMode) {
      navigate(`/${username}`);
    }
  };

  const displayName = isGhostMode ? 'Anonymous' : (fullName || username);
  const displayUsername = isGhostMode ? 'anonymous' : username;
  const displayAvatar = isGhostMode ? undefined : avatarUrl;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div 
        className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center transition-opacity ${!isGhostMode ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={handleProfileClick}
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">
            {isGhostMode ? '?' : (displayName?.charAt(0) || 'U')}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          {/* User info */}
          <div className="flex items-center gap-2 flex-wrap">
            <p 
              className={`font-semibold text-foreground ${!isGhostMode ? 'cursor-pointer hover:underline' : ''}`}
              onClick={handleProfileClick}
            >
              {displayName}
            </p>
            {isVerified && !isGhostMode && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
            <p 
              className={`text-sm text-muted-foreground ${!isGhostMode ? 'cursor-pointer hover:underline' : ''}`}
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
      </div>
    </div>
  );
}
