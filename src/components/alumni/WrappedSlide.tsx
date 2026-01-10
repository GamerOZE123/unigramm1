import { cn } from '@/lib/utils';

interface SlideData {
  type: 'intro' | 'stat' | 'highlight' | 'final';
  title: string;
  subtitle?: string;
  value?: string;
  emoji?: string;
  footer?: string;
  gradient: string;
}

interface WrappedSlideProps {
  slide: SlideData;
}

export const WrappedSlide = ({ slide }: WrappedSlideProps) => {
  return (
    <div
      className={cn(
        "h-full w-full flex flex-col items-center justify-center p-8 text-white",
        `bg-gradient-to-br ${slide.gradient}`
      )}
    >
      {slide.type === 'intro' && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl mb-4">{slide.emoji || '🎓'}</div>
          <h1 className="text-3xl font-bold">{slide.title}</h1>
          <p className="text-lg text-white/80">{slide.subtitle}</p>
        </div>
      )}

      {slide.type === 'stat' && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl mb-2">{slide.emoji}</div>
          <p className="text-lg text-white/80 uppercase tracking-wider">{slide.title}</p>
          <h2 className="text-5xl font-bold">{slide.value}</h2>
          <p className="text-sm text-white/70">{slide.subtitle}</p>
        </div>
      )}

      {slide.type === 'highlight' && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl mb-2">{slide.emoji}</div>
          <p className="text-lg text-white/80 uppercase tracking-wider">{slide.title}</p>
          <h2 className="text-4xl font-bold">{slide.value}</h2>
          <p className="text-sm text-white/70">{slide.subtitle}</p>
        </div>
      )}

      {slide.type === 'final' && (
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl font-bold">{slide.title}</h1>
          <p className="text-xl text-white/90">{slide.subtitle}</p>
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-lg font-medium">{slide.footer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WrappedSlide;
