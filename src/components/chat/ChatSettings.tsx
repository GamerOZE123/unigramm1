import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  MessageSquareX,
  Trash2,
  UserX,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChatSettingsProps {
  user: {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
  };
  conversationId: string;
  onClose: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onChatDeleted?: () => void;
}

export default function ChatSettings({ 
  user: chatUser, 
  conversationId,
  onClose, 
  onClearChat,
  onDeleteChat,
  onChatDeleted
}: ChatSettingsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    checkMuteStatus();
  }, [conversationId, user?.id]);

  const checkMuteStatus = async () => {
    if (!user || !conversationId) return;
    
    const { data } = await supabase
      .from('muted_chats')
      .select('id')
      .eq('user_id', user.id)
      .eq('chat_id', conversationId)
      .maybeSingle();
    
    setMuteNotifications(!!data);
  };

  const handleMuteToggle = async (muted: boolean) => {
    if (!user || !conversationId) return;
    
    setLoading(true);
    try {
      if (muted) {
        await supabase
          .from('muted_chats')
          .insert({ user_id: user.id, chat_id: conversationId });
      } else {
        await supabase
          .from('muted_chats')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', conversationId);
      }
      setMuteNotifications(muted);
      toast.success(muted ? 'Chat muted' : 'Chat unmuted');
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error('Failed to update mute settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!chatUser?.user_id || !user) return;
    
    setBlockLoading(true);
    try {
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: chatUser.user_id,
      });
      
      if (error) throw error;
      
      toast.success('User blocked');
      onChatDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleClearChat = () => {
    onClearChat();
    toast.success('Chat cleared');
  };

  const handleDeleteChat = () => {
    onDeleteChat();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface/30 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Chat Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* User Profile */}
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden ring-4 ring-border cursor-pointer hover:ring-primary transition-all"
            onClick={() => navigate(`/${chatUser.username}`)}
          >
            {chatUser.avatar_url ? (
              <img src={chatUser.avatar_url} alt={chatUser.full_name || chatUser.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {chatUser.full_name?.charAt(0) || chatUser.username?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="text-center">
            <h3 
              className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/${chatUser.username}`)}
            >
              {chatUser.full_name || chatUser.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{chatUser.username}</p>
            {chatUser.university && (
              <p className="text-sm text-muted-foreground mt-1">{chatUser.university}</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 bg-surface rounded-xl space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {muteNotifications ? <BellOff className="w-4 h-4 text-muted-foreground" /> : <Bell className="w-4 h-4" />}
              <span className="text-sm">Mute notifications</span>
            </div>
            <Switch
              checked={muteNotifications}
              onCheckedChange={handleMuteToggle}
              disabled={loading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm mb-3">Actions</h3>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleClearChat}
          >
            <MessageSquareX className="w-4 h-4 mr-3" />
            Clear Chat
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleDeleteChat}
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete Chat
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleBlockUser}
            disabled={blockLoading}
          >
            {blockLoading ? (
              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
            ) : (
              <UserX className="w-4 h-4 mr-3" />
            )}
            Block User
          </Button>
        </div>
      </div>
    </div>
  );
}
