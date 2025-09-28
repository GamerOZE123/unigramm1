
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Heart, Info, Filter, Search, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreateMarketplaceItemModal from './CreateMarketplaceItemModal';
import MarketplaceItemCard from './MarketplaceItemCard';
import ItemDetailModal from './ItemDetailModal';
import { useAuth } from '@/contexts/AuthContext';

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

export default function BuySellPage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
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

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading marketplace items...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="post-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Buy & Sell</h2>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            List Item
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items..."
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
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="post-card group">
              {/* Image */}
              <div className="relative h-48 bg-surface rounded-xl overflow-hidden mb-4">
                <img
                  src={item.image_urls?.[0] || '/placeholder.svg'}
                  alt={item.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                />
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
                  ${item.price}
                </div>
                
                {/* Action buttons for owner */}
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
                      onClick={() => handleDelete(item.id)}
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
                  <h3 className="font-semibold text-foreground text-base md:text-lg line-clamp-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg md:text-xl font-bold text-primary">${item.price}</p>
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
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Be the first to list an item!
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateMarketplaceItemModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchItems();
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

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
