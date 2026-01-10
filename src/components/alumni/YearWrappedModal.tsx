import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Share2, Download, ArrowRight, Sparkles } from 'lucide-react';
import { useWrappedStats } from '@/hooks/useWrappedStats';
import WrappedSlide from './WrappedSlide';
import confetti from 'canvas-confetti';

interface YearWrappedModalProps {
  open: boolean;
  onClose: () => void;
  yearNumber: number;
  yearLabel: string;
  isGraduationYear: boolean;
}

const yearEmojis: Record<number, string> = {
  1: '🌟',
  2: '🚀',
  3: '⚡',
  4: '🎓',
  5: '👑',
  6: '📚',
  7: '🔬',
};

const yearGradients: Record<number, string> = {
  1: 'from-emerald-500 to-teal-600',
  2: 'from-blue-500 to-indigo-600',
  3: 'from-purple-500 to-violet-600',
  4: 'from-amber-500 to-orange-600',
  5: 'from-rose-500 to-pink-600',
  6: 'from-cyan-500 to-blue-600',
  7: 'from-indigo-500 to-purple-600',
};

export const YearWrappedModal = ({ 
  open, 
  onClose, 
  yearNumber, 
  yearLabel, 
  isGraduationYear 
}: YearWrappedModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { stats, loading } = useWrappedStats();

  const emoji = yearEmojis[yearNumber] || '✨';
  const baseGradient = yearGradients[yearNumber] || 'from-violet-500 to-indigo-600';

  const slides = stats ? [
    {
      type: 'intro' as const,
      title: `${yearLabel} Complete!`,
      subtitle: `Let's celebrate your ${yearLabel.toLowerCase()} journey`,
      gradient: baseGradient,
    },
    {
      type: 'stat' as const,
      title: 'Time This Year',
      value: `${stats.timeOnPlatform.months > 0 ? `${stats.timeOnPlatform.months} month${stats.timeOnPlatform.months > 1 ? 's' : ''} ` : ''}${stats.timeOnPlatform.days} day${stats.timeOnPlatform.days !== 1 ? 's' : ''}`,
      subtitle: 'Active on Unigramm',
      emoji: '⏰',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      type: 'stat' as const,
      title: 'Messages Sent',
      value: stats.messagesSent.toLocaleString(),
      subtitle: 'Conversations with friends',
      emoji: '💬',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      type: 'stat' as const,
      title: 'New Connections',
      value: stats.connections.toLocaleString(),
      subtitle: 'People you connected with',
      emoji: '🤝',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      type: 'stat' as const,
      title: 'Clubs Joined',
      value: stats.clubsJoined.toLocaleString(),
      subtitle: 'Communities you\'re part of',
      emoji: '🎭',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      type: 'stat' as const,
      title: 'Posts Shared',
      value: stats.postsCreated.toLocaleString(),
      subtitle: 'Your stories this year',
      emoji: '📝',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      type: 'stat' as const,
      title: 'Likes Received',
      value: stats.likesReceived.toLocaleString(),
      subtitle: 'Love from the community',
      emoji: '❤️',
      gradient: 'from-red-500 to-pink-600',
    },
    ...(stats.mostDMedPerson ? [{
      type: 'highlight' as const,
      title: 'Your Best Friend',
      value: stats.mostDMedPerson.name,
      subtitle: `${stats.mostDMedPerson.messageCount} messages exchanged`,
      emoji: '👥',
      gradient: 'from-indigo-500 to-purple-600',
    }] : []),
    {
      type: 'final' as const,
      title: `${emoji} ${yearLabel} Done!`,
      subtitle: `${stats.university} · ${stats.major}`,
      footer: isGraduationYear ? 'Ready for the next chapter!' : `See you in ${getNextYear(yearNumber)}!`,
      gradient: baseGradient,
    },
  ] : [];

  useEffect(() => {
    setCurrentSlide(0);
  }, [open]);

  useEffect(() => {
    if (open && currentSlide === slides.length - 1) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [currentSlide, open, slides.length]);

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
    // TODO: Implement share to feed
    console.log('Share to feed');
  };

  const handleDownload = () => {
    // TODO: Implement download as image
    console.log('Download as image');
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
                    onClick={onClose}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Done
                    <Sparkles className="h-4 w-4 ml-2" />
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

function getNextYear(currentYearNum: number): string {
  const nextYears: Record<number, string> = {
    1: '2nd Year',
    2: '3rd Year',
    3: '4th Year',
    4: 'graduation',
    5: 'graduation',
    6: 'your next chapter',
    7: 'your next chapter',
  };
  return nextYears[currentYearNum] || 'next year';
}

export default YearWrappedModal;
