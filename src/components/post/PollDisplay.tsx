import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface PollDisplayProps {
  postId: string;
  question: string;
  options: Array<{ text: string; votes: number }>;
  endsAt?: string;
}

export default function PollDisplay({ postId, question, options: initialOptions, endsAt }: PollDisplayProps) {
  const { user } = useAuth();
  const [options, setOptions] = useState(initialOptions);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserVote();
    calculateTotalVotes();
  }, [postId]);

  const fetchUserVote = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserVote(data.option_index);
    }
  };

  const calculateTotalVotes = () => {
    const total = options.reduce((sum, option) => sum + option.votes, 0);
    setTotalVotes(total);
  };

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    if (userVote !== null) {
      toast.error('You have already voted');
      return;
    }

    setLoading(true);
    try {
      // Record vote
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          post_id: postId,
          user_id: user.id,
          option_index: optionIndex,
        });

      if (error) throw error;

      // Update local state
      const newOptions = [...options];
      newOptions[optionIndex].votes += 1;
      setOptions(newOptions);
      setUserVote(optionIndex);
      setTotalVotes(totalVotes + 1);

      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    } finally {
      setLoading(false);
    }
  };

  const isPollEnded = endsAt ? new Date(endsAt) < new Date() : false;

  return (
    <div className="bg-muted/20 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-foreground">{question}</h3>
      
      <div className="space-y-2">
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = userVote === index;

          return (
            <div key={index} className="relative">
              {userVote === null && !isPollEnded ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 hover:bg-muted"
                  onClick={() => handleVote(index)}
                  disabled={loading}
                >
                  {option.text}
                </Button>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-border bg-background">
                  <div className="relative z-10 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{option.text}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="absolute bottom-0 left-0 right-0 h-full rounded-none opacity-20" 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {endsAt && (
          <span>
            {isPollEnded ? 'Poll ended' : `Ends ${new Date(endsAt).toLocaleDateString()}`}
          </span>
        )}
      </div>
    </div>
  );
}
