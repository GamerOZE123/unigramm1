import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDatingMessages } from '@/hooks/useDatingMatches';
import type { DatingMatch } from '@/hooks/useDatingMatches';
import { format } from 'date-fns';

interface DatingChatWindowProps {
  match: DatingMatch;
}

export default function DatingChatWindow({ match }: DatingChatWindowProps) {
  const { user } = useAuth();
  const { messages, sendMessage } = useDatingMessages(match.id);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
          {match.other_user.avatar_url ? (
            <img src={match.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
              {(match.other_user.full_name?.[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground">
          {match.other_user.full_name || match.other_user.username || 'Match'}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-10">Say hello! 💜</p>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] px-4 py-2 rounded-2xl text-sm',
                  isMine
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}
              >
                <p>{msg.content}</p>
                <p className={cn('text-[10px] mt-1', isMine ? 'text-white/60' : 'text-muted-foreground')}>
                  {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          size="icon"
          disabled={!input.trim()}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
