import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Settings } from 'lucide-react';

interface MobileChatHeaderProps {
  userName: string;
  userUniversity: string;
  userAvatar?: string;
  onBackClick: () => void;
  onMenuClick?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onBlockUser?: () => void;
  onSettings?: () => void;
  isGroup?: boolean;
}

export default function MobileChatHeader({ 
  userName, 
  userUniversity, 
  userAvatar,
  onBackClick,
  onMenuClick,
  onClearChat,
  onDeleteChat,
  onBlockUser,
  onSettings,
  isGroup = false
}: MobileChatHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-card border-b border-border p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${isGroup ? 'from-accent to-primary' : 'from-primary to-accent'} rounded-full flex items-center justify-center overflow-hidden relative`}>
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {userName?.charAt(0) || (isGroup ? 'G' : 'U')}
                </span>
              )}
              {isGroup && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center ring-2 ring-card">
                  <Users className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{userName}</h3>
              <p className="text-sm text-muted-foreground">{userUniversity}</p>
            </div>
          </div>
        </div>
        
        {/* Settings Button */}
        {onSettings && (
          <Button variant="ghost" size="icon" onClick={onSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
