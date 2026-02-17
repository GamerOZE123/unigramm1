import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Ghost } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateConfessionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export function CreateConfessionModal({ open, onClose, onSubmit }: CreateConfessionModalProps) {
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState<{ username: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Detect @mention typing
  useEffect(() => {
    const match = content.match(/@(\w+)$/);
    if (match && match[1].length >= 2) {
      searchUsers(match[1]);
    } else {
      setShowSuggestions(false);
    }
  }, [content]);

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .ilike("username", `${query}%`)
      .limit(5);

    if (data && data.length > 0) {
      setSuggestions(data.filter((d) => d.username));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (username: string) => {
    const newContent = content.replace(/@(\w+)$/, `@${username} `);
    setContent(newContent);
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-pink-400" />
            New Confession
          </DialogTitle>
          <DialogDescription>
            Your identity stays completely anonymous. Use @username to tag someone.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Textarea
            placeholder="Share your confession... Use @username to tag someone"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="resize-none"
          />

          {showSuggestions && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-popover border border-border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.username}
                  onClick={() => insertMention(s.username!)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <span className="text-primary">@{s.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            Post Anonymously
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
