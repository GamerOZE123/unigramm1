import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConfessions } from "@/hooks/useConfessions";
import { CreateConfessionModal } from "@/components/confessions/CreateConfessionModal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Ghost, Send, Smile, MessageCircle, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Confession, ConfessionComment } from "@/hooks/useConfessions";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const TEXT_EMOJIS = ["😀", "😂", "🥰", "😍", "🤔", "👍", "❤️", "🎉", "🔥", "✨", "💯", "🙏"];

function ConfessionBubble({
  confession,
  onReaction,
  onFetchComments,
  onAddComment,
}: {
  confession: Confession;
  onReaction: (id: string, emoji: string) => void;
  onFetchComments: (id: string) => Promise<ConfessionComment[]>;
  onAddComment: (id: string, content: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mine = confession.user_id === user?.id;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ConfessionComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

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
    const data = await onFetchComments(confession.id);
    setComments(data);
  };

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
    <div className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex-shrink-0 flex items-center justify-center">
        <Ghost className="w-4 h-4 text-pink-400" />
      </div>

      <div className={`flex-1 max-w-[80%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg p-3 border ${
            mine ? "bg-pink-500/20 border-pink-500/30" : "bg-card border-border"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-pink-400">Anonymous</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-foreground text-sm whitespace-pre-wrap">{renderContent(confession.content)}</p>
        </div>

        {/* Reactions + comment toggle */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {confession.reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReaction(confession.id, r.emoji)}
              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
                r.hasReacted
                  ? "bg-pink-500/30 border border-pink-500/50"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="text-muted-foreground">{r.count}</span>
            </button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <button className="w-6 h-6 rounded-full bg-card border border-border hover:bg-muted flex items-center justify-center transition-colors">
                <Smile className="w-3 h-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align={mine ? "end" : "start"}>
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

          <button
            onClick={toggleComments}
            className="w-6 h-6 rounded-full bg-card border border-border hover:bg-muted flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-3 h-3 text-muted-foreground" />
          </button>
          {confession.comment_count > 0 && (
            <span className="text-xs text-muted-foreground">{confession.comment_count}</span>
          )}
        </div>

        {/* Inline comments */}
        {showComments && (
          <div className={`w-full mt-2 border border-border rounded-lg p-2 bg-muted/30 space-y-2`}>
            {loadingComments ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No replies yet</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Ghost className="w-2.5 h-2.5 text-pink-300" />
                  </div>
                  <div>
                    <span className="text-xs text-pink-300 font-medium">Anonymous </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                    <p className="text-xs text-foreground">{renderContent(c.content)}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder="Reply anonymously…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="text-xs h-7"
              />
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()} className="h-7 px-2">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Confessions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { confessions, loading, createConfession, toggleReaction, fetchComments, addComment } = useConfessions();
  const [message, setMessage] = useState("");
  const [showMentionModal, setShowMentionModal] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (viewportRef.current) {
      const el = viewportRef.current.querySelector("[data-radix-scroll-area-viewport]");
      el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [confessions]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await createConfession(message.trim());
    setMessage("");
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/university")} className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Ghost className="w-6 h-6 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">Confessions</h2>
              <p className="text-sm text-muted-foreground truncate">Anonymous · Tag people with @username</p>
            </div>
          </div>
        </div>

        {/* Messages feed */}
        <ScrollArea className="flex-1 p-4" ref={viewportRef}>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Loading…</p>
            </div>
          ) : confessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Ghost className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No confessions yet</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to confess!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...confessions].reverse().map((c) => (
                <ConfessionBubble
                  key={c.id}
                  confession={c}
                  onReaction={toggleReaction}
                  onFetchComments={fetchComments}
                  onAddComment={addComment}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2 items-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {TEXT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => addEmoji(e)}
                      className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors text-lg"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Confess something… Use @username to tag"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim()} className="flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your identity is completely anonymous. Visible to all students in your university.
          </p>
        </div>
      </div>
    </Layout>
  );
}
