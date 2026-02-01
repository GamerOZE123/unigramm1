
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageButtonProps {
  userId: string;
}

export default function MessageButton({ userId }: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: userId
        });

      if (error) throw error;

      navigate(`/chat?conversation=${data}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  // Don't show message button for own profile
  if (!user || user.id === userId) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStartChat}
      className="flex items-center gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      Message
    </Button>
  );
}
