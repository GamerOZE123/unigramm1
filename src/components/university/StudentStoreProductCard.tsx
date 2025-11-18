import React from 'react';
import { Package, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentStoreProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  product_type: string;
  category: string | null;
  image_urls: string[] | null;
  stock_quantity: number | null;
  tags: string[] | null;
  digital_file_url: string | null;
  created_at: string;
  user_id: string;
}

interface StudentStoreProductCardProps {
  product: StudentStoreProduct;
}

export default function StudentStoreProductCard({ product }: StudentStoreProductCardProps) {
  const imageUrl = product.image_urls?.[0] || '/placeholder.svg';

  return (
    <div className="post-card overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img 
          src={imageUrl} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            {product.product_type === 'digital' ? (
              <><Download className="h-3 w-3" /> Digital</>
            ) : (
              <><Package className="h-3 w-3" /> Physical</>
            )}
          </Badge>
        </div>
        {product.category && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              {product.category}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.title}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">${product.price}</span>
          {product.product_type === 'physical' && product.stock_quantity !== null && (
            <span className="text-xs text-muted-foreground">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
