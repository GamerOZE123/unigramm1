
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Target, Users, Award } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  prize_description?: string;
  participant_count?: number;
}

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  isJoined: boolean;
  onJoin: (challengeId: string) => void;
}

export default function ChallengeDetailModal({ 
  isOpen, 
  onClose, 
  challenge, 
  isJoined, 
  onJoin 
}: ChallengeDetailModalProps) {
  if (!challenge) return null;

  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <DialogTitle className="text-xl">{challenge.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {challenge.description && (
            <p className="text-muted-foreground">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-medium">{challenge.target_value} {challenge.target_unit}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="font-medium">{challenge.participant_count || 0} joined</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-lg">
            <p className="text-sm font-medium text-foreground">Challenge Type</p>
            <p className="text-sm text-muted-foreground capitalize">{challenge.challenge_type}</p>
          </div>

          {challenge.prize_description && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Prize</p>
              </div>
              <p className="text-sm text-yellow-700">{challenge.prize_description}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button 
              className="flex-1" 
              disabled={isJoined || daysLeft <= 0}
              onClick={() => onJoin(challenge.id)}
            >
              {isJoined ? 'Already Joined' : daysLeft <= 0 ? 'Challenge Ended' : 'Join Challenge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
