
import React, { useState } from 'react';
import { Hash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HashtagSelectorProps {
  hashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
}

export default function HashtagSelector({ hashtags, onHashtagsChange }: HashtagSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddHashtag = () => {
    if (inputValue.trim() && !hashtags.includes(inputValue.trim().toLowerCase())) {
      const newHashtag = inputValue.trim().toLowerCase().replace(/^#/, '');
      onHashtagsChange([...hashtags, newHashtag]);
      setInputValue('');
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    onHashtagsChange(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  return (
    <div className="space-y-2">
      {!showInput ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowInput(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Hash className="w-5 h-5" />
        </Button>
      ) : (
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add hashtag"
              className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              autoFocus
            />
          </div>
          <Button size="sm" onClick={handleAddHashtag} disabled={!inputValue.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
            Cancel
          </Button>
        </div>
      )}
      
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
              <Hash className="w-3 h-3" />
              <span>{tag}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveHashtag(tag)}
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
