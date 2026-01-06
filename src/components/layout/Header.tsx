
import React from 'react';
import { Bell, Settings, LogOut, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export default function Header() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useUnreadMessages();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 hidden md:block">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Uni</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/chat')}
            className="text-muted-foreground hover:text-foreground relative"
          >
            <MessageCircle className="w-4 h-4" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1">
                {messageCount > 99 ? '99+' : messageCount}
              </span>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/notifications')}
            className="text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
