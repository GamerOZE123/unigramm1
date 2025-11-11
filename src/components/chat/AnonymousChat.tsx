import { useState, useRef, useEffect } from 'react';
import { Send, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnonymousChat } from '@/hooks/useAnonymousChat';
import { formatDistanceToNow } from 'date-fns';

export function AnonymousChat() {
  const [message, setMessage] = useState('');
  const { messages, loading, sendMessage } = useAnonymousChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                  <Ghost className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-purple-400">Anonymous</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-foreground">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
