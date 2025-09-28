import React, { useState, useEffect } from 'react';
import { SimpleAuction } from '@/types/simplified';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  condition: string;
  location: string;
  created_at: string;
  user_id: string;
}

export default function MarketplacePageFixed() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [auctions, setAuctions] = useState<SimpleAuction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map((auction: any) => ({
        id: auction.id,
        title: auction.title || auction.item_name || 'Auction Item',
        description: auction.description || '',
        starting_price: auction.starting_price || 0,
        current_price: auction.current_price || auction.starting_price || 0,
        image_urls: auction.image_urls || [],
        end_time: auction.end_time || new Date().toISOString(),
        created_at: auction.created_at,
        user_id: auction.user_id,
        reserve_price: auction.starting_price || 0,
        is_active: true,
        winner_id: null,
        bid_count: 0
      }));
      
      setAuctions(transformedData);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAuctions();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading marketplace...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Marketplace</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="text-lg font-bold text-primary">₹{item.price}</p>
              {item.location && <p className="text-xs text-muted-foreground">📍 {item.location}</p>}
            </CardContent>
          </Card>
        ))}
        
        {auctions.map((auction) => (
          <Card key={auction.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{auction.title}</h3>
              <p className="text-sm text-muted-foreground">{auction.description}</p>
              <p className="text-lg font-bold text-green-600">Current: ₹{auction.current_price}</p>
              <p className="text-sm text-muted-foreground">Starting: ₹{auction.starting_price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}