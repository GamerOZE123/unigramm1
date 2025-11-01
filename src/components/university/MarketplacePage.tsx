import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Heart,
  Info,
  Filter,
  Search,
  Edit,
  Trash2,
  Clock,
  Users,
  TrendingUp,
  ShoppingBag,
  Gavel,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateMarketplaceItemModal from "./CreateMarketplaceItemModal";
import CreateAuctionModal from "./CreateAuctionModal";
import ItemDetailModal from "./ItemDetailModal";
import AuctionDetailModal from "./AuctionDetailModal";
import MarketplaceFloatingButton from "@/components/marketplace/MarketplaceFloatingButton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component

// --- Type Definitions (Kept as is) ---
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
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

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
// --- Helper Components ---

// A more robust Image Carousel renderer
const ImageCarousel = ({
  imageUrls,
  title,
  onImageClick,
}: {
  imageUrls: string[];
  title: string;
  onImageClick: () => void;
}) => {
  const defaultImage = "/placeholder.svg"; // Fallback image path

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="h-48 bg-muted rounded-xl flex items-center justify-center cursor-pointer" onClick={onImageClick}>
        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }

  if (imageUrls.length === 1) {
    return (
      <div className="h-48 bg-muted rounded-xl overflow-hidden cursor-pointer" onClick={onImageClick}>
        <img
          src={imageUrls[0] || defaultImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <Carousel className="h-48 rounded-xl overflow-hidden relative">
      <CarouselContent>
        {imageUrls.map((url, index) => (
          <CarouselItem key={index}>
            <div className="h-48 cursor-pointer" onClick={onImageClick}>
              <img
                src={url || defaultImage}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {imageUrls.length > 1 && (
        <>
          <CarouselPrevious className="left-2 bg-background/50 hover:bg-background/80" />
          <CarouselNext className="right-2 bg-background/50 hover:bg-background/80" />
        </>
      )}
    </Carousel>
  );
};

// Component for a Buy/Sell Item Card
const MarketplaceItemCard = React.memo(
  ({
    item,
    user,
    setSelectedItem,
    setEditingItem,
    handleDeleteItem,
  }: {
    item: MarketplaceItem;
    user: any; // Use proper Auth type if available
    setSelectedItem: (item: MarketplaceItem) => void;
    setEditingItem: (item: MarketplaceItem) => void;
    handleDeleteItem: (itemId: string) => void;
  }) => (
    <div
      key={item.id}
      className="post-card group hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
      onClick={() => setSelectedItem(item)} // Make the whole card clickable
    >
      <div className="relative mb-3 flex-shrink-0">
        <ImageCarousel imageUrls={item.image_urls} title={item.title} onImageClick={() => setSelectedItem(item)} />

        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-md">
          ₹{item.price.toLocaleString("en-IN")}
        </div>

        {/* User Actions (Edit/Delete) */}
        {user?.id === item.user_id && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(item);
              }}
              className="h-8 w-8 p-0 rounded-full shadow-lg"
              aria-label="Edit Item"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(item.id);
              }}
              className="h-8 w-8 p-0 rounded-full shadow-lg"
              aria-label="Delete Item"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 p-2 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-foreground text-base md:text-lg line-clamp-2 leading-tight">
            {item.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1 min-h-[40px]">{item.description}</p>
        </div>

        <div className="pt-2 border-t border-border mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs font-normal">
              {item.condition}
            </Badge>
            {item.location && (
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> {item.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  ),
);

// Component for an Auction Card
const AuctionCard = React.memo(
  ({
    auction,
    user,
    setSelectedAuction,
    setEditingAuction,
    handleDeleteAuction,
    canEditDeleteAuction,
  }: {
    auction: Auction;
    user: any;
    setSelectedAuction: (auction: Auction) => void;
    setEditingAuction: (auction: Auction) => void;
    handleDeleteAuction: (auctionId: string) => void;
    canEditDeleteAuction: (auction: Auction) => boolean;
  }) => {
    const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
    const isEnded = timeLeft <= 0;
    const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
    const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

    return (
      <div
        key={auction.id}
        className="post-card group hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
        onClick={() => setSelectedAuction(auction)}
      >
        <div className="relative mb-3 flex-shrink-0">
          <ImageCarousel
            imageUrls={auction.image_urls}
            title={auction.title}
            onImageClick={() => setSelectedAuction(auction)}
          />

          {/* Status/Time Left Badge */}
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
              isEnded ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
            }`}
          >
            {isEnded ? "ENDED" : `${hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left`}
          </div>

          {/* User Actions (Edit/Delete) */}
          {canEditDeleteAuction(auction) && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAuction(auction);
                }}
                className="h-8 w-8 p-0 rounded-full shadow-lg"
                aria-label="Edit Auction"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAuction(auction.id);
                }}
                className="h-8 w-8 p-0 rounded-full shadow-lg"
                aria-label="Delete Auction"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 p-2 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-foreground text-base md:text-lg line-clamp-2 leading-tight">
              {auction.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1 min-h-[40px]">{auction.description}</p>
          </div>

          <div className="pt-2 border-t border-border mt-auto">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Current Bid</span>
                <span className="text-xl font-bold text-primary">₹{auction.current_price.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Total Bids</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> {auction.bid_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

// --- Main Marketplace Component ---

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("buysell");
  const [userUniversity, setUserUniversity] = useState<string>("");

  // Modals
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateAuctionModal, setShowCreateAuctionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  const { user } = useAuth();

  // Refactor fetch logic to use useCallback
  const fetchItems = useCallback(async () => {
    if (!userUniversity) return;
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("marketplace_items")
        .select(
          `
          *, 
          profiles:user_id (university)
        `,
        )
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      const filteredItems = itemsData
        .filter((item) => (item.profiles as any)?.university === userUniversity)
        .map(({ profiles, ...rest }) => rest) as MarketplaceItem[];

      setItems(filteredItems);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    }
  }, [userUniversity]);

  const fetchAuctions = useCallback(async () => {
    if (!userUniversity) return;
    try {
      const { data: auctionsData, error: auctionsError } = await supabase
        .from("auctions")
        .select(
          `
          *,
          profiles:user_id (university)
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (auctionsError) throw auctionsError;

      let filteredAuctions = auctionsData
        .filter((auction) => (auction.profiles as any)?.university === userUniversity)
        .map(({ profiles, ...rest }) => rest) as Auction[];

      if (filteredAuctions.length > 0) {
        const auctionIds = filteredAuctions.map((auction) => auction.id);
        const { data: bidCounts, error: bidError } = await supabase
          .from("auction_bids")
          .select("auction_id")
          .in("auction_id", auctionIds);

        if (bidError) throw bidError;

        const bidCountMap = new Map();
        bidCounts?.forEach((bid) => {
          const count = bidCountMap.get(bid.auction_id) || 0;
          bidCountMap.set(bid.auction_id, count + 1);
        });

        filteredAuctions = filteredAuctions.map((auction) => ({
          ...auction,
          bid_count: bidCountMap.get(auction.id) || 0,
        }));
      }

      setAuctions(filteredAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [userUniversity]);

  // Combined fetch function
  const refetchAllData = useCallback(() => {
    fetchItems();
    fetchAuctions();
  }, [fetchItems, fetchAuctions]);

  // Use a single useEffect for initial data fetching
  useEffect(() => {
    let isMounted = true;

    const fetchAndSetUniversity = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.from("profiles").select("university").eq("user_id", user.id).single();
        if (data && isMounted) {
          setUserUniversity(data.university || "");
        }
      } catch (e) {
        console.error("Error fetching university:", e);
        if (isMounted) setLoading(false);
      }
    };

    fetchAndSetUniversity();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (userUniversity) {
      refetchAllData();
    }
  }, [userUniversity, refetchAllData]);

  // --- Utility Functions ---
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      setItems((i) => i.filter((item) => item.id !== itemId)); // Optimistic update
      const { error } = await supabase.from("marketplace_items").delete().eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting item:", error);
      fetchItems(); // Revert on error
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm("Are you sure you want to delete this auction?")) return;
    try {
      setAuctions((a) => a.filter((auction) => auction.id !== auctionId)); // Optimistic update
      const { error } = await supabase.from("auctions").delete().eq("id", auctionId);
      if (error) throw error;
      fetchAuctions();
    } catch (error) {
      console.error("Error deleting auction:", error);
      fetchAuctions(); // Revert on error
    }
  };

  const canEditDeleteAuction = (auction: Auction) => {
    return (
      user?.id === auction.user_id &&
      (auction.bid_count || 0) === 0 &&
      new Date(auction.end_time).getTime() > new Date().getTime()
    );
  };

  // Filter logic remains the same
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredAuctions = auctions.filter(
    (auction) =>
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- Rendering Functions ---

  const renderLoader = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="post-card flex flex-col space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="space-y-2 p-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAuctionStats = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="text-center p-4 bg-card rounded-xl shadow-sm border border-border">
        <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
        <p className="text-lg md:text-2xl font-bold text-foreground">{auctions.length}</p>
        <p className="text-xs md:text-sm text-muted-foreground">Active Auctions</p>
      </div>
      <div className="text-center p-4 bg-card rounded-xl shadow-sm border border-border">
        <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
        <p className="text-lg md:text-2xl font-bold text-foreground">
          {auctions.reduce((sum, auction) => sum + (auction.bid_count || 0), 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">Total Bids</p>
      </div>
      <div className="text-center p-4 bg-card rounded-xl shadow-sm border border-border">
        <DollarSign className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary" />
        <p className="text-lg md:text-2xl font-bold text-foreground">
          ₹
          {auctions
            .reduce((sum, auction) => sum + auction.current_price, 0)
            .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">Current Value</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-20" />
        </div>
        {renderLoader()}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 -mt-2">
        <h1 className="text-3xl font-extrabold text-foreground mb-4 flex items-center gap-3">
          <ShoppingBag className="w-7 h-7" /> University Marketplace
        </h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items, books, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <Button variant="outline" className="sm:w-auto w-full rounded-xl shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 rounded-xl bg-card shadow-inner">
            <TabsTrigger
              value="buysell"
              className="flex items-center gap-2 text-base data-[state=active]:shadow-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Buy & Sell
            </TabsTrigger>
            <TabsTrigger
              value="auctions"
              className="flex items-center gap-2 text-base data-[state=active]:shadow-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Gavel className="w-5 h-5" />
              Auctions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buysell" className="mt-6 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Items for Sale</h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <MarketplaceItemCard
                    key={item.id}
                    item={item}
                    user={user}
                    setSelectedItem={setSelectedItem}
                    setEditingItem={setEditingItem}
                    handleDeleteItem={handleDeleteItem}
                  />
                ))}
              </div>
            ) : (
              <div className="post-card text-center py-16 rounded-xl border-2 border-dashed border-border">
                <p className="text-xl text-muted-foreground mb-4">
                  {searchQuery ? "No items found matching your search." : "Be the first to list something!"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateItemModal(true)} className="mt-4 text-base shadow-lg">
                    <Plus className="w-5 h-5 mr-2" /> List an Item
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions" className="mt-6 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Live Auctions</h2>
            {renderAuctionStats()}

            {filteredAuctions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    user={user}
                    setSelectedAuction={setSelectedAuction}
                    setEditingAuction={setEditingAuction}
                    handleDeleteAuction={handleDeleteAuction}
                    canEditDeleteAuction={canEditDeleteAuction}
                  />
                ))}
              </div>
            ) : (
              <div className="post-card text-center py-16 rounded-xl border-2 border-dashed border-border">
                <p className="text-xl text-muted-foreground mb-4">
                  {searchQuery ? "No auctions found matching your search." : "Start an exciting auction for your item!"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateAuctionModal(true)} className="mt-4 text-base shadow-lg">
                    <Gavel className="w-5 h-5 mr-2" /> Create an Auction
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals (No structural change needed here, just cleaner props) */}
      {showCreateItemModal && (
        <CreateMarketplaceItemModal
          onClose={() => setShowCreateItemModal(false)}
          onSuccess={() => {
            setShowCreateItemModal(false);
            fetchItems();
          }}
        />
      )}
      {showCreateAuctionModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateAuctionModal(false)}
          onSuccess={() => {
            setShowCreateAuctionModal(false);
            fetchAuctions();
          }}
        />
      )}
      {editingItem && (
        <CreateMarketplaceItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            fetchItems();
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
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {selectedAuction && (
        <AuctionDetailModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onBidPlaced={fetchAuctions}
        />
      )}

      {/* Floating Button */}
      <MarketplaceFloatingButton
        onItemCreated={fetchItems}
        onAuctionCreated={fetchAuctions}
        // Assuming this component has internal logic to handle which modal to open
      />
    </div>
  );
}
