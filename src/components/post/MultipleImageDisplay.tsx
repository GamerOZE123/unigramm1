import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import ImageModal from './ImageModal';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MultipleImageDisplayProps {
  imageUrls: string[];
  hashtags?: string[];
  onHashtagClick?: (hashtag: string, e: React.MouseEvent) => void;
  className?: string;
  onLike?: (e?: React.MouseEvent) => void;
  onComment?: (e?: React.MouseEvent) => void;
  onShare?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  postId?: string;
  postContent?: string;
}

const isImageUrl = (url: string) => {
  return (
    url.includes('placeholder.com') ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const isVideoUrl = (url: string) => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

const isPlaceholder = (url: string) => {
  return url.startsWith('uploading-');
};

const getImageAspectRatio = (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width / img.height);
    };
    img.onerror = () => {
      resolve(16/9); // Fallback ratio
    };
    img.src = url;
  });
};

const shouldConstrainImage = (actualRatio: number): boolean => {
  // Constrain very tall images (like phone screenshots) and very wide images
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    // Mobile: constrain tall images more aggressively
    return actualRatio > 2.5 || actualRatio < 0.6;
  }
  // Desktop: constrain very tall images
  return actualRatio < 0.6;
};

const getDisplayAspectRatio = (actualRatio: number): number => {
  // On mobile
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    if (actualRatio > 2.5) {
      return 16/9; // Constrain very wide images
    }
    if (actualRatio < 0.6) {
      return 3/4; // Constrain tall images (like phone screenshots)
    }
  }
  // On desktop
  if (actualRatio < 0.6) {
    return 9/16; // More constrained for very tall images on desktop
  }
  return actualRatio;
};

export default function MultipleImageDisplay({ 
  imageUrls,
  hashtags,
  onHashtagClick,
  className = '', 
  onLike, 
  onComment, 
  onShare, 
  isLiked = false, 
  likesCount = 0, 
  commentsCount = 0,
  postId = '',
  postContent = ''
}: MultipleImageDisplayProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [imageAspectRatios, setImageAspectRatios] = useState<{[key: number]: number}>({});

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Load image dimensions for all images
  React.useEffect(() => {
    const loadImageDimensions = async () => {
      const ratios: {[key: number]: number} = {};
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (isImageUrl(url) && !isPlaceholder(url)) {
          ratios[i] = await getImageAspectRatio(url);
        }
      }
      setImageAspectRatios(ratios);
    };

    if (imageUrls.length > 0) {
      loadImageDimensions();
    }
  }, [imageUrls]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowFullImage(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => 
        prev === 0 ? imageUrls.length - 1 : prev - 1
      );
    } else {
      setSelectedImageIndex((prev) => 
        prev === imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (!imageUrls || imageUrls.length === 0) return null;

  // Single image/video display
  if (imageUrls.length === 1) {
    const mediaUrl = imageUrls[0];
    const aspectRatio = imageAspectRatios[0];
    const isVideo = isVideoUrl(mediaUrl);
    
    // Determine display ratio with constraints (only for images)
    let displayRatio = aspectRatio || 16/9;
    
    if (!isVideo) {
      // Constrain portrait images (taller than square) to max 4:3
      if (displayRatio < 1) {
        displayRatio = Math.max(displayRatio, 3/4);
      }
      // Constrain very wide images to max 16:9
      if (displayRatio > 2) {
        displayRatio = 16/9;
      }
    }
    
    return (
      <>
        <div className={`w-full max-w-md ${className}`} data-image-container>
          {isPlaceholder(mediaUrl) ? (
            <ImagePlaceholder status="loading" className="max-w-md" />
          ) : isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full rounded-xl"
            />
          ) : (
            <div 
              className="relative w-full bg-muted rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group"
              style={{ aspectRatio: displayRatio }}
              onClick={() => handleImageClick(0)}
            >
              <img
                src={mediaUrl}
                alt="Post content"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
        
        {!isPlaceholder(mediaUrl) && !isVideo && (
          <ImageModal
            imageUrl={mediaUrl}
            isOpen={showFullImage}
            onClose={() => setShowFullImage(false)}
            alt="Post content"
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            isLiked={isLiked}
            likesCount={likesCount}
            commentsCount={commentsCount}
          />
        )}
      </>
    );
  }

  // Multiple images carousel
  return (
    <>
      <div className={`w-full max-w-md ${className}`} data-image-container>
        <Carousel 
          setApi={setApi} 
          className="w-full"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent>
            {imageUrls.map((mediaUrl, index) => {
              const isVideo = isVideoUrl(mediaUrl);
              
              return (
                <CarouselItem key={index}>
                  <div className="relative">
                    {isPlaceholder(mediaUrl) ? (
                      <ImagePlaceholder status="loading" />
                    ) : isVideo ? (
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full rounded-xl"
                      />
                    ) : (
                      <div 
                        className="relative w-full bg-muted rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group"
                        style={{ 
                          aspectRatio: (() => {
                            const ratio = imageAspectRatios[index] || 16/9;
                            // Constrain portrait to 4:3, wide to 16:9
                            if (ratio < 1) return Math.max(ratio, 3/4);
                            if (ratio > 2) return 16/9;
                            return ratio;
                          })()
                        }}
                        onClick={() => handleImageClick(index)}
                      >
                        <img
                          src={mediaUrl}
                          alt={`Post content ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    {/* Image counter */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                      {index + 1}/{imageUrls.length}
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {/* Navigation arrows */}
          {imageUrls.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white border-none hover:bg-black/80" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white border-none hover:bg-black/80" />
            </>
          )}
        </Carousel>
        
        {/* Dot indicators */}
        {imageUrls.length > 1 && (
          <div className="flex justify-center space-x-2 mt-3">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  current === index + 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full screen image modal with navigation */}
      {!isPlaceholder(imageUrls[selectedImageIndex]) && (
        <ImageModal
          imageUrl={imageUrls[selectedImageIndex]}
          isOpen={showFullImage}
          onClose={() => setShowFullImage(false)}
          alt={`Post content ${selectedImageIndex + 1}`}
          showNavigation={imageUrls.length > 1}
          onNavigate={navigateImage}
          currentIndex={selectedImageIndex + 1}
          totalImages={imageUrls.length}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          isLiked={isLiked}
          likesCount={likesCount}
          commentsCount={commentsCount}
        />
      )}
    </>
  );
}