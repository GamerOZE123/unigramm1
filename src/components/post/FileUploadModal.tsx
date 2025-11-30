import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

interface Startup {
  id: string;
  title: string;
}

interface UploadingImage {
  file: File;
  url?: string;
  uploaded: boolean;
}

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<'global' | 'university'>('global');
  const [userStartups, setUserStartups] = useState<Startup[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's startups
  React.useEffect(() => {
    const fetchUserStartups = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('student_startups')
        .select('id, title')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setUserStartups(data);
      }
    };
    
    if (isOpen) {
      fetchUserStartups();
    }
  }, [user, isOpen]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (selectedFiles.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 media files');
      return;
    }

    const newFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not an image or video file`);
        return false;
      }

      // Check file size limits
      const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the ${isImage ? '5MB' : '50MB'} limit`);
        return false;
      }

      return true;
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setUploadingImages(prev => [
      ...prev,
      ...newFiles.map(file => ({ file, uploaded: false }))
    ]);
  };

  // Remove image
  const removeImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setUploadingImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Progressive uploads
  const uploadImages = async (files: File[], postId: string): Promise<string[]> => {
    return Promise.all(
      files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${postId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        // Update progressive state
        setUploadingImages(prev =>
          prev.map((img, i) =>
            i === index ? { ...img, url: urlData.publicUrl, uploaded: true } : img
          )
        );

        return urlData.publicUrl;
      })
    );
  };

  // Handle final upload (post + images)
  const handleUpload = async () => {
    if (!user || (selectedFiles.length === 0 && !caption.trim())) {
      toast.error('Please add at least one image or caption');
      return;
    }

    setUploading(true);
    try {
      // Create post - database trigger will extract hashtags from content
      const postData = {
        user_id: user.id,
        content: caption.trim() || 'New post',
        image_urls: null,
        visibility: visibility,
        startup_id: selectedStartupId
      };

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      toast.info('Uploading media files...');

      // Upload images in parallel
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(selectedFiles, post.id);

        // Update post with final image URLs
        await supabase
          .from('posts')
          .update({ image_urls: imageUrls })
          .eq('id', post.id);
      }

      toast.success('Post uploaded successfully!');

      // Reset form
      setSelectedFiles([]);
      setUploadingImages([]);
      setCaption('');

      // Notify parent and close
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error uploading post:', error);
      toast.error('Failed to upload post');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadingImages([]);
    setCaption('');
    setVisibility('global');
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
          {/* Visibility Selector */}
          <div className="flex gap-2 p-3 bg-muted/30 rounded-lg">
            <button
              type="button"
              onClick={() => setVisibility('global')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                visibility === 'global'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              🌍 Global
            </button>
            <button
              type="button"
              onClick={() => setVisibility('university')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                visibility === 'university'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              🎓 University Only
            </button>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= 10}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Media ({selectedFiles.length}/10)
              </Button>
              
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
            </div>

            {uploadingImages.length > 0 && (
              <div className={`grid gap-2 ${
                uploadingImages.length === 1 ? 'grid-cols-1' : 
                uploadingImages.length === 2 ? 'grid-cols-2' : 
                uploadingImages.length === 3 ? 'grid-cols-3' : 
                'grid-cols-2'
              }`}>
                {uploadingImages.map((img, index) => {
                  const isVideo = img.file.type.startsWith('video/');
                  const previewUrl = URL.createObjectURL(img.file);
                  
                  return (
                    <div key={index} className="relative group">
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        {img.uploaded && img.url ? (
                          isVideo ? (
                            <video
                              src={img.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <img
                              src={img.url}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <>
                            {isVideo ? (
                              <video
                                src={previewUrl}
                                className="w-full h-full object-cover opacity-50"
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover opacity-50"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {uploadingImages.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images selected yet</p>
                <p className="text-sm">Click "Add Images" to upload up to 10 photos</p>
              </div>
            )}
          </div>

          {/* Startup Selection */}
          {userStartups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to Startup (Optional)</label>
              <select
                value={selectedStartupId || ''}
                onChange={(e) => setSelectedStartupId(e.target.value || null)}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">No startup linked</option>
                {userStartups.map((startup) => (
                  <option key={startup.id} value={startup.id}>
                    {startup.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Caption Section */}
          <div>
            <Textarea
              placeholder="Write a caption... (Use #hashtags in your caption)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Add hashtags directly in your caption like #fitness #health
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || (selectedFiles.length === 0 && !caption.trim())}
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
