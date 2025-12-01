import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, User } from 'lucide-react';

interface Startup {
  id: string;
  title: string;
  logo_url: string | null;
  category: string;
  type: 'startup';
}

interface UserProfile {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  type: 'user';
}

type MentionItem = Startup | UserProfile;

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect: (item: MentionItem) => void;
  placeholder?: string;
}

export default function MentionInput({
  value,
  onChange,
  onMentionSelect,
  placeholder = "What's on your mind?"
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionItem[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkForMention = async () => {
      const textBeforeCursor = value.substring(0, cursorPosition);
      const match = textBeforeCursor.match(/@([\w-]*)$/);
      
      if (match) {
        const query = match[1].toLowerCase();
        try {
          // Search both users and startups
          const [usersResult, startupsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, username, full_name, avatar_url')
              .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
              .limit(3),
            supabase
              .from('student_startups')
              .select('id, title, logo_url, category')
              .ilike('title', `%${query}%`)
              .limit(3)
          ]);

          const users: UserProfile[] = (usersResult.data || []).map(u => ({
            ...u,
            type: 'user' as const
          }));

          const startups: Startup[] = (startupsResult.data || []).map(s => ({
            ...s,
            type: 'startup' as const
          }));

          // Combine and sort - users first, then startups
          setSuggestions([...users, ...startups]);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching mentions:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    };

    checkForMention();
  }, [value, cursorPosition]);

  const handleSelect = (item: MentionItem) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const match = textBeforeCursor.match(/@([\w-]*)$/);
    
    if (match) {
      const startIndex = textBeforeCursor.lastIndexOf('@');
      const mentionText = item.type === 'user' ? item.username : item.title;
      const newValue = 
        value.substring(0, startIndex) + 
        `@${mentionText} ` + 
        textAfterCursor;
      
      onChange(newValue);
      onMentionSelect(item);
      setShowSuggestions(false);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
        placeholder={placeholder}
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full p-2 shadow-lg bg-background border-border">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {suggestions.map((item) => (
              <div
                key={item.type === 'user' ? item.user_id : item.id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                onClick={() => handleSelect(item)}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.type === 'user' ? (
                    item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )
                  ) : (
                    item.logo_url ? (
                      <img src={item.logo_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    @{item.type === 'user' ? item.username : item.title}
                  </p>
                  {item.type === 'user' ? (
                    <p className="text-xs text-muted-foreground truncate">{item.full_name}</p>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}