import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
  matchedUser?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  onChat?: () => void;
}

export default function MatchModal({ open, onClose, matchedUser, onChat }: MatchModalProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (open && !fired.current) {
      fired.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#a855f7', '#6366f1'],
      });
    }
    if (!open) fired.current = false;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-pink-500/30 bg-gradient-to-b from-card to-card/95">
        <div className="flex flex-col items-center gap-4 py-6">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            It's a Match! 🎉
          </h2>

          {matchedUser?.avatar_url && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500/50">
              <img src={matchedUser.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-muted-foreground text-sm">
            You and <span className="font-semibold text-foreground">{matchedUser?.full_name || 'someone'}</span> liked each other!
          </p>

          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={onClose}>
              Keep Discovering
            </Button>
            {onChat && (
              <Button
                onClick={onChat}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-0"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send a Message
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
