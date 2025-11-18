import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Store, ShoppingBag, Gavel, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateMarketplaceItemModal from './CreateMarketplaceItemModal';
import CreateAuctionModal from './CreateAuctionModal';
import CreateStudentStoreItemModal from './CreateStudentStoreItemModal';
import StoreSetupModal from './StoreSetupModal';
import StudentStoreProductCard from './StudentStoreProductCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  condition: string;
  location: string;
  is_sold: boolean;
  user_id: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  image_urls: string[];
  end_time: string;
  is_active: boolean;
  user_id: string;
  bid_count?: number;
}

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

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [storeProducts, setStoreProducts] = useState<StudentStoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userUniversity, setUserUniversity] = useState<string>('');
  const [userStore, setUserStore] = useState<any>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  
  // Modals
  const [showStoreSetupModal, setShowStoreSetupModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Fetch university
      const { data: profileData } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setUserUniversity(profileData.university || '');
      }

      // Fetch user's store
      const { data: storeData } = await supabase
        .from('student_stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserStore(storeData);
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (userUniversity) {
      fetchAllData();
    }
  }, [userUniversity, categoryFilter, productTypeFilter]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStoreProducts(),
      fetchMarketplaceItems(),
      fetchAuctions()
    ]);
    setLoading(false);
  };

  const fetchStoreProducts = async () => {
    try {
      let query = supabase
        .from('student_store_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (productTypeFilter !== 'all') {
        query = query.eq('product_type', productTypeFilter);
      }

      const { data: productsData, error } = await query;
      if (error) throw error;

      if (productsData) {
        const productsWithProfiles = await Promise.all(
          productsData.map(async (product) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('university')
              .eq('user_id', product.user_id)
              .single();
            return { ...product, userUniversity: profile?.university };
          })
        );
        const filtered = productsWithProfiles.filter(
          (product: any) => product.userUniversity === userUniversity
        );
        setStoreProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching student store products:', error);
    }
  };

  const fetchMarketplaceItems = async () => {
    try {
      const { data: itemsData, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
        const filtered = itemsWithProfiles.filter(
          (item: any) => item.userUniversity === userUniversity
        );
        setItems(filtered);
      }
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      const { data: auctionsData, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (auctionsData) {
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
        const filtered = auctionsWithProfiles.filter(
          (auction: any) => auction.userUniversity === userUniversity
        );
        setAuctions(filtered);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading marketplace...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-10">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover and sell items in your campus community</p>
        </div>
        <div className="flex gap-2">
          {userStore && (
            <Button onClick={() => navigate('/store-management')} variant="outline" size="lg" className="gap-2">
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Manage Store</span>
            </Button>
          )}
          <Button 
            onClick={() => {
              if (userStore) {
                setShowStoreModal(true);
              } else {
                setShowStoreSetupModal(true);
              }
            }} 
            size="lg" 
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>{userStore ? 'Add Product' : 'Create Store'}</span>
          </Button>
        </div>
      </div>

      {/* Student Store Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Student Store</h2>
              <p className="text-sm text-muted-foreground">Student-made products and digital goods</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="art">Art & Design</SelectItem>
                <SelectItem value="study">Study Materials</SelectItem>
                <SelectItem value="tech">Tech & Software</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {storeProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {storeProducts.map((product) => (
              <StudentStoreProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="post-card text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Be the first to create a store listing and sell your student-made products!
            </p>
            <Button onClick={() => setShowStoreModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Listing
            </Button>
          </div>
        )}
      </section>

      {/* Buy & Sell Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Buy & Sell</h2>
              <p className="text-sm text-muted-foreground">Used items and campus marketplace</p>
            </div>
          </div>
          <Button onClick={() => setShowMarketplaceModal(true)} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            List Item
          </Button>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="post-card overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {item.image_urls && item.image_urls.length > 0 && (
                    <img 
                      src={item.image_urls[0]} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
                      {item.condition}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">${item.price}</span>
                    {item.location && (
                      <span className="text-xs text-muted-foreground">{item.location}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="post-card text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No items for sale</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start buying and selling used items with your campus community
            </p>
            <Button onClick={() => setShowMarketplaceModal(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              List an Item
            </Button>
          </div>
        )}
      </section>

      {/* Auctions Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Auctions</h2>
              <p className="text-sm text-muted-foreground">Bid on unique items and collectibles</p>
            </div>
          </div>
          <Button onClick={() => setShowAuctionModal(true)} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Auction
          </Button>
        </div>

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <div key={auction.id} className="post-card overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {auction.image_urls && auction.image_urls.length > 0 && (
                    <img 
                      src={auction.image_urls[0]} 
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium flex items-center gap-1">
                      <Gavel className="h-3 w-3" />
                      {auction.bid_count || 0} bids
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{auction.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{auction.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Current Bid</span>
                      <span className="text-xl font-bold text-primary">${auction.current_price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Ends</span>
                      <span className="text-xs font-medium">
                        {new Date(auction.end_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="post-card text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gavel className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No active auctions</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create an auction to let others bid on your items
            </p>
            <Button onClick={() => setShowAuctionModal(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Auction
            </Button>
          </div>
        )}
      </section>

      {/* Modals */}
      <StoreSetupModal 
        open={showStoreSetupModal}
        onOpenChange={setShowStoreSetupModal}
        onSuccess={() => {
          const fetchUserData = async () => {
            if (!user) return;
            const { data: storeData } = await supabase
              .from('student_stores')
              .select('*')
              .eq('user_id', user.id)
              .single();
            setUserStore(storeData);
          };
          fetchUserData();
        }}
      />
      {showStoreModal && userStore && (
        <CreateStudentStoreItemModal 
          storeId={userStore.id}
          onClose={() => setShowStoreModal(false)}
          onSuccess={() => {
            fetchStoreProducts();
            setShowStoreModal(false);
          }}
        />
      )}
      {showMarketplaceModal && (
        <CreateMarketplaceItemModal 
          onClose={() => setShowMarketplaceModal(false)}
          onSuccess={() => {
            fetchMarketplaceItems();
            setShowMarketplaceModal(false);
          }}
        />
      )}
      {showAuctionModal && (
        <CreateAuctionModal 
          onClose={() => setShowAuctionModal(false)}
          onSuccess={() => {
            fetchAuctions();
            setShowAuctionModal(false);
          }}
        />
      )}
    </div>
  );
}
