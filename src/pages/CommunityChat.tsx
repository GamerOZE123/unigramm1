import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityMessages, CommunityMessage } from '@/hooks/useCommunityMessages';
import { supabase } from '@/integrations/supabase/client';
import { CommunityMembersPanel } from '@/components/communities/CommunityMembersPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Community } from '@/hooks/useCommunities';

export default function CommunityChat() {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useCommunityMessages(communityId || null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!communityId) return;
    const fetchCommunity = async () => {
      const { data } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      if (data) setCommunity(data as Community);
    };
    fetchCommunity();
  }, [communityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(input);
    setInput('');
    setSending(false);
  };

  const handleLeave = async () => {
    if (!communityId || !user) return;
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);
    if (!error) {
      toast.success('Left community');
      navigate('/communities');
    }
  };

  if (!community) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/communities')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{community.name}</h2>
            <p className="text-xs text-muted-foreground">{community.member_count} members</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)}>
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLeave}>
            <LogOut className="w-5 h-5 text-destructive" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const mine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || ''} />
                    <AvatarFallback>
                      {(msg.sender?.full_name || msg.sender?.username || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {msg.sender?.full_name || msg.sender?.username || 'Unknown'}
                    </p>
                    <div className={`rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {communityId && (
        <CommunityMembersPanel
          communityId={communityId}
          open={showMembers}
          onOpenChange={setShowMembers}
        />
      )}
    </Layout>
  );
}
