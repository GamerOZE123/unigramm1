import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import HashtagSelector from './HashtagSelector';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
  post: {
    id: string;
    content: string;
    hashtags?: string[];
    image_urls?: string[];
  };
}

export default function EditPostModal({ isOpen, onClose, onPostUpdated, post }: EditPostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content);
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags || []);
  const [imageUrls, setImageUrls] = useState<string[]>(post.image_urls || []);
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

  const handleDeleteImage = async (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedImages);
  };

  const handleUpdate = async () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      // Prepare hashtags - ensure they're properly formatted and not empty
      const formattedHashtags = hashtags
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase().replace(/^#+/, '').trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          hashtags: formattedHashtags.length > 0 ? formattedHashtags : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null
        })
        .eq('id', post.id);

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      toast.success('Post updated successfully!');
      onPostUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setContent(post.content);
    setHashtags(post.hashtags || []);
    setImageUrls(post.image_urls || []);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Post</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="Edit your post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none bg-transparent border-none p-0 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            />
            
            {/* Image Preview with Delete */}
            {imageUrls.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Images
                </label>
                <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-border">
                  <div className="flex gap-2 p-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img 
                          src={url} 
                          alt={`Post image ${index + 1}`}
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Edit Hashtags
                </label>
                <HashtagSelector hashtags={hashtags} onHashtagsChange={setHashtags} />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updating || !content.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}