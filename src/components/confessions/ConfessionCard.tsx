import { useState } from "react";
import { Ghost, Smile, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Confession, ConfessionComment } from "@/hooks/useConfessions";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface ConfessionCardProps {
  confession: Confession;
  onReaction: (confessionId: string, emoji: string) => void;
  onFetchComments: (confessionId: string) => Promise<ConfessionComment[]>;
  onAddComment: (confessionId: string, content: string) => void;
}

export function ConfessionCard({ confession, onReaction, onFetchComments, onAddComment }: ConfessionCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ConfessionComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const navigate = useNavigate();

  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const data = await onFetchComments(confession.id);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await onAddComment(confession.id, commentText.trim());
    setCommentText("");
    // Refresh comments
    const data = await onFetchComments(confession.id);
    setComments(data);
  };

  // Parse @mentions in content
  const renderContent = (text: string) => {
    const parts = text.split(/(@[\w_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <span
            key={i}
            onClick={() => navigate(`/${username}`)}
            className="text-primary font-medium cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
          <Ghost className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <span className="text-sm font-medium text-pink-400">Anonymous</span>
          <span className="text-xs text-muted-foreground ml-2">
            {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {renderContent(confession.content)}
      </p>

      {/* Reactions row */}
      <div className="flex items-center gap-1 flex-wrap">
        {confession.reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => onReaction(confession.id, r.emoji)}
            className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
              r.hasReacted
                ? "bg-pink-500/30 border border-pink-500/50"
                : "bg-muted border border-border hover:bg-accent"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-muted-foreground">{r.count}</span>
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button className="w-7 h-7 rounded-full bg-muted border border-border hover:bg-accent flex items-center justify-center transition-colors">
              <Smile className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => onReaction(confession.id, e)}
                  className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Comment toggle */}
        <button
          onClick={toggleComments}
          className="ml-auto px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-muted border border-border hover:bg-accent transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{confession.comment_count}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border pt-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No comments yet</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <Ghost className="w-3 h-3 text-pink-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-pink-300">Anonymous</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">{renderContent(c.content)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Add anonymous comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddComment();
              }}
              className="text-sm h-8"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8 px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
