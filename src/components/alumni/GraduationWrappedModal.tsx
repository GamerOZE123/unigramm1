import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Share2, Download, ArrowRight } from 'lucide-react';
import { useWrappedStats } from '@/hooks/useWrappedStats';
import WrappedSlide from './WrappedSlide';
import AlumniConversionModal from './AlumniConversionModal';
import confetti from 'canvas-confetti';

interface GraduationWrappedModalProps {
  open: boolean;
  onClose: () => void;
}

export const GraduationWrappedModal = ({ open, onClose }: GraduationWrappedModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { stats, loading } = useWrappedStats();

  const slides = stats ? [
    {
      type: 'intro' as const,
      title: 'Your Unigramm Journey',
      subtitle: "Let's look back at your time with us",
      gradient: 'from-violet-600 to-indigo-600',
    },
    {
      type: 'stat' as const,
      title: 'Time on Unigramm',
      value: `${stats.timeOnPlatform.years > 0 ? `${stats.timeOnPlatform.years} year${stats.timeOnPlatform.years > 1 ? 's' : ''} ` : ''}${stats.timeOnPlatform.months > 0 ? `${stats.timeOnPlatform.months} month${stats.timeOnPlatform.months > 1 ? 's' : ''} ` : ''}${stats.timeOnPlatform.days} day${stats.timeOnPlatform.days !== 1 ? 's' : ''}`,
      subtitle: 'Since you joined our community',
      emoji: '⏰',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      type: 'stat' as const,
      title: 'Messages Sent',
      value: stats.messagesSent.toLocaleString(),
      subtitle: 'Conversations that mattered',
      emoji: '💬',
      gradient: 'from-pink-600 to-rose-600',
    },
    {
      type: 'stat' as const,
      title: 'Connections Made',
      value: stats.connections.toLocaleString(),
      subtitle: 'People you connected with',
      emoji: '🤝',
      gradient: 'from-amber-600 to-orange-600',
    },
    {
      type: 'stat' as const,
      title: 'Clubs Joined',
      value: stats.clubsJoined.toLocaleString(),
      subtitle: 'Communities you were part of',
      emoji: '🎭',
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      type: 'stat' as const,
      title: 'Posts Created',
      value: stats.postsCreated.toLocaleString(),
      subtitle: 'Stories you shared',
      emoji: '📝',
      gradient: 'from-purple-600 to-violet-600',
    },
    {
      type: 'stat' as const,
      title: 'Likes Received',
      value: stats.likesReceived.toLocaleString(),
      subtitle: 'Love from the community',
      emoji: '❤️',
      gradient: 'from-red-600 to-pink-600',
    },
    ...(stats.mostDMedPerson ? [{
      type: 'highlight' as const,
      title: 'Your Closest Connection',
      value: stats.mostDMedPerson.name,
      subtitle: `${stats.mostDMedPerson.messageCount} messages exchanged`,
      emoji: '👥',
      gradient: 'from-indigo-600 to-purple-600',
    }] : []),
    {
      type: 'final' as const,
      title: `🎓 Class of ${stats.graduationYear}`,
      subtitle: `${stats.university} · ${stats.major}`,
      footer: 'Unigramm Alumni',
      gradient: 'from-amber-500 to-yellow-500',
    },
  ] : [];

  useEffect(() => {
    if (open && currentSlide === slides.length - 1) {
      // Trigger confetti on final slide
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

  const handleContinue = () => {
    setShowConversionModal(true);
  };

  const handleConversionComplete = () => {
    setShowConversionModal(false);
    onClose();
  };

  if (loading || !stats) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="flex items-center justify-center h-[600px] bg-gradient-to-br from-violet-600 to-indigo-600">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <>
      <Dialog open={open && !showConversionModal} onOpenChange={onClose}>
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
                      onClick={handleContinue}
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

      {/* Alumni Conversion Modal */}
      <AlumniConversionModal
        open={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        onComplete={handleConversionComplete}
      />
    </>
  );
};

export default GraduationWrappedModal;
