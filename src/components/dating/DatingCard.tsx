import React, { useState } from 'react';
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DatingCandidate } from '@/hooks/useDatingCandidates';

interface DatingCardProps {
  candidate: DatingCandidate;
  onLike: () => void;
  onPass: () => void;
}

export default function DatingCard({ candidate, onLike, onPass }: DatingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const images = candidate.images_json?.length ? candidate.images_json : (candidate.avatar_url ? [candidate.avatar_url] : []);
  const totalPhotos = images.length;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex < totalPhotos - 1) setPhotoIndex(i => i + 1);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(i => i - 1);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl bg-card border border-border" style={{ aspectRatio: '3/4' }}>
      {/* Photo area */}
      <div className="relative w-full h-[70%] bg-muted">
        {images.length > 0 ? (
          <img
            src={images[photoIndex]}
            alt={candidate.full_name || 'Profile'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No photos
          </div>
        )}

        {/* Tap zones for photo navigation */}
        {totalPhotos > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10" onClick={prevPhoto} />
            <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10" onClick={nextPhoto} />
          </>
        )}

        {/* Photo progress dots */}
        {totalPhotos > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-20 px-4">
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full flex-1 transition-colors',
                  i === photoIndex ? 'bg-white' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        )}

        {/* Gradient overlay at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Name overlay */}
        <div className="absolute bottom-3 left-4 z-20">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">
            {candidate.full_name || candidate.username || 'Unknown'}
          </h3>
          {candidate.university && (
            <p className="text-sm text-white/80">{candidate.university}</p>
          )}
        </div>
      </div>

      {/* Info area */}
      <div className="p-4 h-[30%] flex flex-col justify-between">
        <div className="space-y-1 overflow-hidden">
          {candidate.looking_for && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">
              {candidate.looking_for}
            </span>
          )}
          {candidate.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{candidate.bio}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={onPass}
            className="w-14 h-14 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground hover:text-destructive" />
          </button>
          <button
            onClick={onLike}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
