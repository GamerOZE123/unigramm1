
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Users, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreateAuctionModal from './CreateAuctionModal';
import AuctionCard from './AuctionCard';
import AuctionDetailModal from './AuctionDetailModal';
import { useAuth } from '@/contexts/AuthContext';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  reserve_price: number;
  image_urls: string[];
  end_time: string;
  is_active: boolean;
  winner_id: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  bid_count?: number;
}

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const { data: auctionsData, error: auctionsError } = await supabase
        .from('auctions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (auctionsError) throw auctionsError;

      if (auctionsData && auctionsData.length > 0) {
        // Get bid counts for each auction
        const auctionIds = auctionsData.map(auction => auction.id);
        const { data: bidCounts, error: bidError } = await supabase
          .from('auction_bids')
          .select('auction_id')
          .in('auction_id', auctionIds);

        if (bidError) throw bidError;

        const bidCountMap = new Map();
        bidCounts?.forEach(bid => {
          const count = bidCountMap.get(bid.auction_id) || 0;
          bidCountMap.set(bid.auction_id, count + 1);
        });

        const auctionsWithData = auctionsData.map(auction => ({
          ...auction,
          bid_count: bidCountMap.get(auction.id) || 0
        }));

        setAuctions(auctionsWithData);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDelete = (auction: Auction) => {
    return user?.id === auction.user_id && auction.bid_count === 0;
  };

  const handleDelete = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) return;

    try {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', auctionId);

      if (error) throw error;

      fetchAuctions();
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading auctions...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="post-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Live Auctions</h2>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Auction
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-surface rounded-xl">
            <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
            <p className="text-lg md:text-2xl font-bold text-foreground">{auctions.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Active Auctions</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl">
            <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
            <p className="text-lg md:text-2xl font-bold text-foreground">
              {auctions.reduce((sum, auction) => sum + (auction.bid_count || 0), 0)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Bids</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
            <p className="text-lg md:text-2xl font-bold text-foreground">
              ${auctions.reduce((sum, auction) => sum + auction.current_price, 0).toFixed(2)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Value</p>
          </div>
        </div>
      </div>

      {/* Auctions Grid */}
      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {auctions.map((auction) => {
            const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
            const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
            const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
            const imageUrl = auction.image_urls?.[0] || '/placeholder.svg';

            return (
              <div key={auction.id} className="post-card group">
                {/* Image */}
                <div className="relative h-48 bg-surface rounded-xl overflow-hidden mb-4">
                  <img
                    src={imageUrl}
                    alt={auction.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedAuction(auction)}
                  />
                  {timeLeft > 0 ? (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                      {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      Ended
                    </div>
                  )}

                  {/* Action buttons for owner (only if no bids) */}
                  {canEditDelete(auction) && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingAuction(auction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(auction.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-base md:text-lg line-clamp-1">{auction.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{auction.description}</p>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Bid</p>
                      <p className="text-lg md:text-xl font-bold text-primary">${auction.current_price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Starting</p>
                      <p className="text-sm font-medium text-foreground">${auction.starting_price}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{auction.bid_count || 0} bids</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {timeLeft > 0 ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="post-card text-center py-12">
          <p className="text-muted-foreground">No active auctions yet.</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Create the first auction!
          </Button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAuctions();
          }}
        />
      )}

      {editingAuction && (
        <CreateAuctionModal
          auction={editingAuction}
          onClose={() => setEditingAuction(null)}
          onSuccess={() => {
            setEditingAuction(null);
            fetchAuctions();
          }}
        />
      )}

      {selectedAuction && (
        <AuctionDetailModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onBidPlaced={fetchAuctions}
        />
      )}
    </div>
  );
}
