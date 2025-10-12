
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function ImageUploadModal({ isOpen, onClose, onPostCreated }: ImageUploadModalProps) {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user || (!selectedImage && !caption.trim())) {
      toast.error('Please add an image or caption');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        console.log('Uploading image:', fileName);
        
        // For now, we'll create a placeholder URL since storage isn't configured
        // In a real app, you would upload to Supabase storage here
        imageUrl = `https://via.placeholder.com/600x400?text=Image+${fileName}`;
      }

      // Create the post
      console.log('Creating post with user:', user.id);
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption.trim() || 'New post',
          image_url: imageUrl
        })
        .select();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully:', data);
      toast.success('Post uploaded successfully!');
      
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setCaption('');
      
      // Notify parent and close modal
      onPostCreated();
    } catch (error) {
      console.error('Error uploading post:', error);
      toast.error('Failed to upload post');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Post
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-muted rounded-lg p-6">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-[500px] object-contain rounded-lg bg-muted"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">Select an image to upload</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          {/* Caption Section */}
          <div>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || (!selectedImage && !caption.trim())}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
