import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatingMatches, useDatingMessages } from '@/hooks/useDatingMatches';
import DatingChatWindow from '@/components/dating/DatingChatWindow';
import MobileLayout from '@/components/layout/MobileLayout';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DatingChat() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { matches, loading } = useDatingMatches();

  const match = matches.find(m => m.id === matchId);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!match) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-muted-foreground">Match not found</p>
          <Button variant="outline" onClick={() => navigate('/dating')}>
            Back to Dating
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center gap-2 p-3 border-b border-border md:hidden">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dating')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1">
          <DatingChatWindow match={match} />
        </div>
      </div>
    </MobileLayout>
  );
}
