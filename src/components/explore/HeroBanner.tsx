import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface BannerItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link?: string;
}

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<any>();

  // Mock data - replace with actual data from your backend
  const banners: BannerItem[] = [
    {
      id: '1',
      title: 'Global Hackathon 2025',
      description: 'Join students from 50+ universities in the biggest coding challenge',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    },
    {
      id: '2',
      title: 'Student Startups Showcase',
      description: 'Discover innovative projects built by students worldwide',
      image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    },
    {
      id: '3',
      title: 'Tech Summit 2025',
      description: 'Connect with industry leaders and fellow student innovators',
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    },
  ];

  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <Card className="relative overflow-hidden border-0 rounded-xl">
                <div className="relative h-[200px] md:h-[280px] w-full">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h2>
                    <p className="text-sm md:text-base text-white/90">{banner.description}</p>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              currentIndex === index ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
