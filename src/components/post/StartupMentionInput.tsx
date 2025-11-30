import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket } from 'lucide-react';

interface Startup {
  id: string;
  title: string;
  logo_url: string | null;
  category: string;
}

interface StartupMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onStartupSelect: (startup: Startup) => void;
  placeholder?: string;
}

export default function StartupMentionInput({
  value,
  onChange,
  onStartupSelect,
  placeholder = "What's on your mind?"
}: StartupMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Startup[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkForMention = async () => {
      const textBeforeCursor = value.substring(0, cursorPosition);
      const match = textBeforeCursor.match(/@(\w*)$/);
      
      if (match) {
        const query = match[1].toLowerCase();
        try {
          const { data, error } = await supabase
            .from('student_startups')
            .select('id, title, logo_url, category')
            .ilike('title', `%${query}%`)
            .limit(5);

          if (error) throw error;
          setSuggestions(data || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching startups:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    };

    checkForMention();
  }, [value, cursorPosition]);

  const handleSelect = (startup: Startup) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    
    if (match) {
      const startIndex = textBeforeCursor.lastIndexOf('@');
      const newValue = 
        value.substring(0, startIndex) + 
        `@${startup.title} ` + 
        textAfterCursor;
      
      onChange(newValue);
      onStartupSelect(startup);
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
        <Card className="absolute z-50 mt-1 w-full p-2 shadow-lg">
          <div className="space-y-1">
            {suggestions.map((startup) => (
              <div
                key={startup.id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => handleSelect(startup)}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">@{startup.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    {startup.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}