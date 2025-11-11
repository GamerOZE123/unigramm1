import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PinnedMessage {
  id: string;
  message?: {
    content: string;
    created_at: string;
    sender?: {
      full_name: string;
      avatar_url: string;
    };
  };
}

interface PinnedMessagesPanelProps {
  pinnedMessages: PinnedMessage[];
  isAdmin: boolean;
  onUnpin: (id: string) => void;
  onClose: () => void;
}

export default function PinnedMessagesPanel({
  pinnedMessages,
  isAdmin,
  onUnpin,
  onClose,
}: PinnedMessagesPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Pinned Messages</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {pinnedMessages.length > 0 ? (
            pinnedMessages.map((pinned) => (
              <div
                key={pinned.id}
                className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={pinned.message?.sender?.avatar_url} />
                    <AvatarFallback>
                      {pinned.message?.sender?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {pinned.message?.sender?.full_name || 'Unknown'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {pinned.message?.created_at &&
                          formatDistanceToNow(new Date(pinned.message.created_at), {
                            addSuffix: true,
                          })}
                      </span>
                    </div>
                    <p className="text-sm">{pinned.message?.content}</p>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUnpin(pinned.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pinned messages</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
