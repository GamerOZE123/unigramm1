import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Share2, Download, ArrowRight, Sparkles, ArrowUpCircle } from 'lucide-react';
import { useWrappedStats } from '@/hooks/useWrappedStats';
import WrappedSlide from './WrappedSlide';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SemesterWrappedModalProps {
  open: boolean;
  onClose: () => void;
  semesterType: 'fall' | 'spring';
  semesterNumber: number; // 1-8 for typical 4-year program
  yearLabel: string;
  yearNumber: number;
  onSemesterComplete?: () => void;
}

const semesterEmojis = {
  fall: '🍂',
  spring: '🌸',
};

const semesterGradients = {
  fall: 'from-orange-500 to-amber-600',
  spring: 'from-pink-500 to-rose-500',
};

const semesterNames = {
  fall: 'Fall',
  spring: 'Spring',
};

export const SemesterWrappedModal = ({ 
  open, 
  onClose, 
  semesterType,
  semesterNumber,
  yearLabel,
  yearNumber,
  onSemesterComplete,
}: SemesterWrappedModalProps) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNextChoice, setShowNextChoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { stats, loading } = useWrappedStats();

  const emoji = semesterEmojis[semesterType];
  const baseGradient = semesterGradients[semesterType];
  const semesterName = semesterNames[semesterType];
  const isSpring = semesterType === 'spring';

  const slides = stats ? [
    {
      type: 'intro' as const,
      title: `${semesterName} Semester Complete!`,
      subtitle: `${yearLabel} • Semester ${semesterNumber}`,
      emoji,
      gradient: baseGradient,
    },
    {
      type: 'stat' as const,
      title: 'Semester Activity',
      value: `${stats.timeOnPlatform.months > 0 ? `${stats.timeOnPlatform.months}mo ` : ''}${stats.timeOnPlatform.days}d`,
      subtitle: 'Active on Unigramm this semester',
      emoji: '📅',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      type: 'stat' as const,
      title: 'Messages Sent',
      value: stats.messagesSent.toLocaleString(),
      subtitle: 'Conversations this semester',
      emoji: '💬',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      type: 'stat' as const,
      title: 'New Connections',
      value: stats.connections.toLocaleString(),
      subtitle: 'Friends made this semester',
      emoji: '🤝',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      type: 'stat' as const,
      title: 'Posts Shared',
      value: stats.postsCreated.toLocaleString(),
      subtitle: 'Your semester stories',
      emoji: '📝',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      type: 'stat' as const,
      title: 'Engagement',
      value: (stats.likesReceived + stats.commentsWritten).toLocaleString(),
      subtitle: 'Likes & comments received',
      emoji: '❤️',
      gradient: 'from-red-500 to-pink-600',
    },
    ...(stats.mostDMedPerson ? [{
      type: 'highlight' as const,
      title: 'Semester Buddy',
      value: stats.mostDMedPerson.name,
      subtitle: `${stats.mostDMedPerson.messageCount} messages`,
      emoji: '👯',
      gradient: 'from-indigo-500 to-purple-600',
    }] : []),
    {
      type: 'final' as const,
      title: `${emoji} ${semesterName} Done!`,
      subtitle: `${stats.university} • ${yearLabel}`,
      footer: isSpring 
        ? `See you next year! ${yearNumber < 4 ? '🚀' : '🎓'}` 
        : 'See you in Spring! 🌸',
      gradient: baseGradient,
    },
  ] : [];

  useEffect(() => {
    setCurrentSlide(0);
    setShowNextChoice(false);
  }, [open]);

  useEffect(() => {
    if (open && currentSlide === slides.length - 1) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: semesterType === 'fall' 
          ? ['#f97316', '#f59e0b', '#eab308'] 
          : ['#ec4899', '#f472b6', '#fb7185'],
      });
    }
  }, [currentSlide, open, slides.length, semesterType]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleShare = () => {
    toast.info('Share feature coming soon!');
  };

  const handleDownload = () => {
    toast.info('Download feature coming soon!');
  };

  const handleDone = () => {
    setShowNextChoice(true);
  };

  const handleConfirmComplete = async () => {
    if (!user) return;
    
    setProcessing(true);
    try {
      // Call the callback to update semester tracking
      onSemesterComplete?.();
      toast.success(`${semesterName} Semester completed! 🎉`);
      onClose();
    } catch (error: any) {
      console.error('Error completing semester:', error);
      toast.error('Failed to complete semester');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !stats) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className={`flex items-center justify-center h-[600px] bg-gradient-to-br ${baseGradient}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show completion confirmation
  if (showNextChoice) {
    const nextSemester = isSpring ? 'Fall' : 'Spring';
    const nextYearText = isSpring ? `${yearNumber + 1}${getOrdinalSuffix(yearNumber + 1)} Year` : yearLabel;
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${baseGradient} flex items-center justify-center`}>
              <span className="text-3xl">{emoji}</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">
                {semesterName} Semester Complete! {emoji}
              </h3>
              <p className="text-muted-foreground mt-2">
                {isSpring 
                  ? `Ready to complete ${yearLabel} and move to the next year?`
                  : `Ready for ${nextSemester} semester?`
                }
              </p>
            </div>
            <div className="w-full space-y-3">
              <Button 
                onClick={handleConfirmComplete} 
                disabled={processing}
                className={`w-full bg-gradient-to-r ${baseGradient}`}
              >
                {processing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Complete {semesterName} Semester
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Go back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        <div className="relative h-[600px]">
          {/* Slide Content */}
          <WrappedSlide slide={slide} />

          {/* Navigation */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {isLastSlide ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleDone}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

export default SemesterWrappedModal;
