import { useState, useRef, useEffect } from "react";
import { Send, Ghost, Smile, ImagePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnonymousChat } from "@/hooks/useAnonymousChat";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const TEXT_EMOJIS = ["😀", "😂", "🥰", "😍", "🤔", "👍", "❤️", "🎉", "🔥", "✨", "💯", "🙏"];

export function AnonymousChat() {
  const [message, setMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { messages, loading, sendMessage, toggleReaction } = useAnonymousChat();
  const viewportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (viewportRef.current) {
      const el = viewportRef.current.querySelector("[data-radix-scroll-area-viewport]");
      el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(data.path);

      setImageUrl(publicUrl);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !imageUrl) return;
    const messageContent = imageUrl 
      ? `${message.trim()}\n[IMAGE]${imageUrl}[/IMAGE]` 
      : message.trim();
    await sendMessage(messageContent);
    setMessage("");
    setImageUrl(null);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const renderMessageContent = (content: string) => {
    const imageMatch = content.match(/\[IMAGE\](.*?)\[\/IMAGE\]/);
    if (imageMatch) {
      const [fullMatch, imageUrl] = imageMatch;
      const textContent = content.replace(fullMatch, "").trim();
      return (
        <>
          {textContent && <p className="text-foreground mb-2">{textContent}</p>}
          <img 
            src={imageUrl} 
            alt="Shared image" 
            className="rounded-lg max-w-full h-auto max-h-64 object-cover"
          />
        </>
      );
    }
    return <p className="text-foreground">{content}</p>;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Ghost className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">Ghost Chat</h2>
            <p className="text-sm text-muted-foreground truncate">University-wide anonymous messaging</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={viewportRef}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading…</p>
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
              const mine = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                    <Ghost className="w-4 h-4 text-purple-400" />
                  </div>

                  <div className={`flex-1 max-w-[70%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-lg p-3 border ${
                        mine ? "bg-purple-500/20 border-purple-500/30" : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-purple-400">Anonymous</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {renderMessageContent(msg.message)}
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {msg.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() => toggleReaction(msg.id, r.emoji)}
                          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                            r.hasReacted
                              ? "bg-purple-500/30 border border-purple-500/50"
                              : "bg-card border border-border hover:bg-muted"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className="text-muted-foreground">{r.count}</span>
                        </button>
                      ))}

                      {/* Add reaction */}
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
                                onClick={() => toggleReaction(msg.id, e)}
                                className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                              >
                                {e}
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
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        {imageUrl && (
          <div className="mb-2 relative inline-block">
            <img src={imageUrl} alt="Preview" className="h-20 rounded-lg" />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="flex-shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
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
            placeholder="Send an anonymous message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKey}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={(!message.trim() && !imageUrl) || uploadingImage}
            className="flex-shrink-0"
          >
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
