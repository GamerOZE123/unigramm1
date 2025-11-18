import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Heart, Info, Filter, Search, Edit, Trash2, Clock, Users, TrendingUp, ShoppingBag, Gavel, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateMarketplaceItemModal from './CreateMarketplaceItemModal';
import CreateAuctionModal from './CreateAuctionModal';
import CreateStudentStoreItemModal from './CreateStudentStoreItemModal';
import ItemDetailModal from './ItemDetailModal';
import AuctionDetailModal from './AuctionDetailModal';
import StudentStoreProductCard from './StudentStoreProductCard';
import MarketplaceFloatingButton from '@/components/marketplace/MarketplaceFloatingButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [storeProducts, setStoreProducts] = useState<StudentStoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('buysell');
  const [userUniversity, setUserUniversity] = useState<string>('');
  
  // Filters for Student Store
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  
  // Modals
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateAuctionModal, setShowCreateAuctionModal] = useState(false);
  const [showCreateStoreItemModal, setShowCreateStoreItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserUniversity = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setUserUniversity(data.university || '');
      }
    };
    fetchUserUniversity();
  }, [user]);

  useEffect(() => {
    if (userUniversity) {
      fetchItems();
      fetchAuctions();
      fetchStoreProducts();
    }
  }, [userUniversity]);

  const fetchItems = async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Filter by university - get profiles for each item
      if (itemsData) {
        const itemsWithProfiles = await Promise.all(
          itemsData.map(async (item) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('university')
              .eq('user_id', item.user_id)
              .single();
            return { ...item, userUniversity: profile?.university };
          })
        );
        const filteredItems = itemsWithProfiles.filter(
          (item) => item.userUniversity === userUniversity
        );
        setItems(filteredItems);
      }
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      const { data: auctionsData, error: auctionsError } = await supabase
        .from('auctions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (auctionsError) throw auctionsError;

      if (auctionsData && auctionsData.length > 0) {
        // Filter by university
        const auctionsWithProfiles = await Promise.all(
          auctionsData.map(async (auction) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('university')
              .eq('user_id', auction.user_id)
              .single();
            return { ...auction, userUniversity: profile?.university };
          })
        );
        
        const filteredAuctions = auctionsWithProfiles.filter(
          (auction) => auction.userUniversity === userUniversity
        );

        const auctionIds = filteredAuctions.map(auction => auction.id);
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

        const auctionsWithData = filteredAuctions.map(auction => ({
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

  const fetchStoreProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('student_store_items')
        .select(`
          *,
          profiles(full_name, username, avatar_url, university)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Filter by university
      const filteredProducts = (productsData?.filter(
        (product: any) => product.profiles?.university === userUniversity
      ) || []).map((product: any) => ({
        ...product,
        product_type: product.product_type as 'physical' | 'digital'
      }));

      setStoreProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching store products:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
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

  const canEditDeleteAuction = (auction: Auction) => {
    return user?.id === auction.user_id && auction.bid_count === 0;
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuctions = auctions.filter(auction =>
    auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    auction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderImageCarousel = (imageUrls: string[], title: string, onImageClick?: () => void) => {
    if (!imageUrls || imageUrls.length === 0) {
      return (
        <div className="h-48 bg-surface rounded-xl flex items-center justify-center cursor-pointer" onClick={onImageClick}>
          <img src="/placeholder.svg" alt={title} className="w-full h-full object-cover" />
        </div>
      );
    }

    if (imageUrls.length === 1) {
      return (
        <div className="h-48 bg-surface rounded-xl overflow-hidden cursor-pointer" onClick={onImageClick}>
          <img src={imageUrls[0]} alt={title} className="w-full h-full object-cover" />
        </div>
      );
    }

    return (
      <Carousel className="h-48 rounded-xl overflow-hidden">
        <CarouselContent>
          {imageUrls.map((url, index) => (
            <CarouselItem key={index}>
              <div className="h-48 cursor-pointer" onClick={onImageClick}>
                <img src={url} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {imageUrls.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading marketplace...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="post-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Marketplace</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <Button variant="outline" size="sm" className="sm:w-auto w-full">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-2">
            <TabsTrigger value="buysell" className="flex items-center gap-2 text-xs sm:text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Buy &</span> Sell
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex items-center gap-2 text-xs sm:text-sm">
              <Gavel className="w-4 h-4" />
              Auctions
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2 text-xs sm:text-sm">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Student</span> Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buysell" className="space-y-4">

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="post-card group hover:shadow-lg transition-shadow duration-200">
                    <div className="relative mb-4">
                      {renderImageCarousel(item.image_urls, item.title, () => setSelectedItem(item))}
                      
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                        ₹{item.price}
                      </div>
                      
                      {user?.id === item.user_id && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingItem(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-base md:text-lg line-clamp-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg md:text-xl font-bold text-primary">₹{item.price}</p>
                          <p className="text-xs text-muted-foreground">{item.condition}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Info className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>

                      {item.location && (
                        <p className="text-xs text-muted-foreground">📍 {item.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="post-card text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No items found matching your search.' : 'No items available yet.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateItemModal(true)} className="mt-4">
                    Be the first to list an item!
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 mr-4">
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
                    ₹{auctions.reduce((sum, auction) => sum + auction.current_price, 0).toFixed(2)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </div>

            {filteredAuctions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredAuctions.map((auction) => {
                  const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
                  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
                  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

                  return (
                    <div key={auction.id} className="post-card group hover:shadow-lg transition-shadow duration-200">
                      <div className="relative mb-4">
                        {renderImageCarousel(auction.image_urls, auction.title, () => setSelectedAuction(auction))}
                        
                        {timeLeft > 0 ? (
                          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                            {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                            Ended
                          </div>
                        )}

                        {canEditDeleteAuction(auction) && (
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
                              onClick={() => handleDeleteAuction(auction.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-base md:text-lg line-clamp-1">{auction.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{auction.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Bid</p>
                            <p className="text-lg md:text-xl font-bold text-primary">₹{auction.current_price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Starting</p>
                            <p className="text-sm font-medium text-foreground">₹{auction.starting_price}</p>
                          </div>
                        </div>

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
                <p className="text-muted-foreground">
                  {searchQuery ? 'No auctions found matching your search.' : 'No active auctions yet.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateAuctionModal(true)} className="mt-4">
                    Create the first auction!
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            {/* Filters for Student Store */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Art & Design">Art & Design</SelectItem>
                  <SelectItem value="Handmade Crafts">Handmade Crafts</SelectItem>
                  <SelectItem value="Digital Art">Digital Art</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                  <SelectItem value="Music & Audio">Music & Audio</SelectItem>
                  <SelectItem value="Writing & Books">Writing & Books</SelectItem>
                  <SelectItem value="Software & Apps">Software & Apps</SelectItem>
                  <SelectItem value="Templates & Guides">Templates & Guides</SelectItem>
                  <SelectItem value="Fashion & Accessories">Fashion & Accessories</SelectItem>
                  <SelectItem value="Home Decor">Home Decor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="physical">Physical Products</SelectItem>
                  <SelectItem value="digital">Digital Products</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setShowCreateStoreItemModal(true)} 
                className="sm:ml-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Product
              </Button>
            </div>

            {storeProducts
              .filter(product => 
                (categoryFilter === 'all' || product.category === categoryFilter) &&
                (productTypeFilter === 'all' || product.product_type === productTypeFilter) &&
                (product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {storeProducts
                  .filter(product => 
                    (categoryFilter === 'all' || product.category === categoryFilter) &&
                    (productTypeFilter === 'all' || product.product_type === productTypeFilter) &&
                    (product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((product) => (
                    <StudentStoreProductCard
                      key={product.id}
                      product={product}
                      isFavorited={false}
                      onToggleFavorite={() => {}}
                      onShowDetails={() => {}}
                      onNext={() => {}}
                      onPrevious={() => {}}
                      canGoNext={product.image_urls ? product.image_urls.length > 1 : false}
                      canGoPrevious={false}
                    />
                  ))}
              </div>
            ) : (
              <div className="post-card text-center py-12">
                <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-2">
                  {searchQuery || categoryFilter !== 'all' || productTypeFilter !== 'all' 
                    ? 'No products found matching your filters.' 
                    : 'No student products yet.'}
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Be the first to showcase your creative work!
                </p>
                {!searchQuery && categoryFilter === 'all' && productTypeFilter === 'all' && (
                  <Button onClick={() => setShowCreateStoreItemModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Your First Product
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
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

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedAuction && (
        <AuctionDetailModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onBidPlaced={fetchAuctions}
        />
      )}

      {showCreateStoreItemModal && (
        <CreateStudentStoreItemModal
          onClose={() => setShowCreateStoreItemModal(false)}
          onSuccess={() => {
            setShowCreateStoreItemModal(false);
            fetchStoreProducts();
          }}
        />
      )}

      <MarketplaceFloatingButton
        onItemCreated={fetchItems}
        onAuctionCreated={fetchAuctions}
      />
    </div>
  );
}