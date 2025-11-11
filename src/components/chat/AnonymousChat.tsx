import { useState, useRef, useEffect } from 'react';
import { Send, Ghost, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnonymousChat } from '@/hooks/useAnonymousChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function AnonymousChat() {
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { messages, loading, sendMessage, toggleReaction } = useAnonymousChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    await sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Ghost className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ghost Chat</h2>
            <p className="text-sm text-muted-foreground">University-wide anonymous messaging</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Ghost className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first to send an anonymous message!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isSent = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isSent ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                    <Ghost className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className={`flex-1 max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-lg p-3 border ${
                      isSent 
                        ? 'bg-purple-500/20 border-purple-500/30' 
                        : 'bg-card border-border'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-purple-400">Anonymous</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground">{msg.message}</p>
                    </div>
                    
                    {/* Reactions */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {msg.reactions.map((reaction) => (
                        <button
                          key={reaction.emoji}
                          onClick={() => toggleReaction(msg.id, reaction.emoji)}
                          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                            reaction.hasReacted
                              ? 'bg-purple-500/30 border border-purple-500/50'
                              : 'bg-card border border-border hover:bg-muted'
                          }`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-muted-foreground">{reaction.count}</span>
                        </button>
                      ))}
                      
                      {/* Add reaction button */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-6 h-6 rounded-full bg-card border border-border hover:bg-muted flex items-center justify-center transition-colors">
                            <Smile className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align={isSent ? 'end' : 'start'}>
                          <div className="flex gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send an anonymous message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your identity is completely anonymous. Messages are visible to all students in your university.
        </p>
      </div>
    </div>
  );
}
