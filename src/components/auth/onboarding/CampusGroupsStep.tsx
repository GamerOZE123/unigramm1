import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CampusGroupsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const CampusGroupsStep = ({ value, onChange }: CampusGroupsStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customGroup, setCustomGroup] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchClubs = async () => {
      if (searchQuery.trim()) {
        const { data } = await supabase
          .from('clubs')
          .select('name')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);
        
        if (data) {
          setSuggestions(data.map(club => club.name));
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchClubs, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const addGroup = (group: string) => {
    if (!value.includes(group)) {
      onChange([...value, group]);
    }
    setSearchQuery('');
    setCustomGroup('');
  };

  const removeGroup = (group: string) => {
    onChange(value.filter(g => g !== group));
  };

  const addCustomGroup = () => {
    if (customGroup.trim()) {
      addGroup(customGroup.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Are you part of any clubs or organizations?</h2>
        <p className="text-muted-foreground">Search or add custom groups</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Search for clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="border rounded-md divide-y">
              {suggestions.map((club) => (
                <div
                  key={club}
                  className="p-2 hover:bg-accent cursor-pointer"
                  onClick={() => addGroup(club)}
                >
                  {club}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add custom group..."
            value={customGroup}
            onChange={(e) => setCustomGroup(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomGroup()}
          />
          <Button size="icon" onClick={addCustomGroup}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {value.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected groups:</p>
            <div className="flex flex-wrap gap-2">
              {value.map((group) => (
                <Badge key={group} variant="secondary">
                  {group}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => removeGroup(group)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
