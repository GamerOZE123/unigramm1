import React from 'react';
import { Heart, Info, ChevronLeft, ChevronRight, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentStoreProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  product_type: 'physical' | 'digital';
  category: string;
  image_urls: string[];
  stock_quantity: number;
  tags: string[];
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface StudentStoreProductCardProps {
  product: StudentStoreProduct;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShowDetails: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function StudentStoreProductCard({
  product,
  isFavorited,
  onToggleFavorite,
  onShowDetails,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: StudentStoreProductCardProps) {
  const imageUrl = product.image_urls?.[0] || '/placeholder.svg';

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-shadow">
      {/* Image */}
      <div className="relative h-64 bg-muted">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows */}
        {canGoPrevious && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {canGoNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            className={`rounded-full p-2 bg-background/90 hover:bg-background ${
              isFavorited ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDetails}
            className="rounded-full p-2 bg-background/90 hover:bg-background text-foreground"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Product Type Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={product.product_type === 'digital' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {product.product_type === 'digital' ? (
              <><Download className="w-3 h-3" /> Digital</>
            ) : (
              <><Package className="w-3 h-3" /> Physical</>
            )}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{product.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
        </div>

        {/* Category & Stock */}
        <div className="flex items-center gap-2 mb-3">
          {product.category && (
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
          )}
          {product.product_type === 'physical' && (
            <span className="text-xs text-muted-foreground">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </span>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">
            ₹{product.price}
          </div>
        </div>

        {/* Seller Info */}
        {product.profiles && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <img
              src={product.profiles.avatar_url || '/placeholder.svg'}
              alt={product.profiles.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {product.profiles.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{product.profiles.username}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
