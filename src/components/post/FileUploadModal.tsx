import React, { useState, useRef, useCallback } from "react";
import { X, Upload, Image as ImageIcon, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// --- COMPONENT TYPES ---
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

interface UploadingImage {
  file: File;
  url?: string;
  uploaded: boolean;
}

// --- MAIN COMPONENT ---

const MAX_FILES = 10;

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // New state for drag over
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterAndAddFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newFilesArray = Array.from(files);
      const totalFiles = selectedFiles.length + newFilesArray.length;

      if (totalFiles > MAX_FILES) {
        toast.error(`You can upload a maximum of ${MAX_FILES} images. Please remove ${totalFiles - MAX_FILES} files.`);
        return;
      }

      const validNewFiles = newFilesArray.filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          return false;
        }
        return true;
      });

      if (validNewFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validNewFiles]);
        setUploadingImages((prev) => [...prev, ...validNewFiles.map((file) => ({ file, uploaded: false }))]);
      }
    },
    [selectedFiles.length],
  );

  // Handle file selection from button click
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    filterAndAddFiles(event.target.files);
    // Clear the input value so the same files can be selected again after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    filterAndAddFiles(event.dataTransfer.files);
  };

  // Remove image
  const removeImage = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setUploadingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Progressive uploads
  const uploadImages = async (files: File[], postId: string): Promise<string[]> => {
    // Note: The original logic updates state inside Promise.all map, which React
    // warns against when not wrapped in effects. For simplicity in this single-file,
    // runnable context, we keep the original progressive state update, but in a real app,
    // a separate progress store or a single post-upload state update is usually cleaner.

    return Promise.all(
      files.map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${postId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        try {
          const { error } = await supabase.storage.from("post-images").upload(fileName, file);

          if (error) throw error;

          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);

          // Update progressive state
          setUploadingImages((prev) =>
            prev.map((img, i) => (i === index ? { ...img, url: urlData.publicUrl, uploaded: true } : img)),
          );
          return urlData.publicUrl;
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          setUploadingImages((prev) =>
            prev.map((img, i) => (i === index ? { ...img, uploaded: false } : img)),
          );
          return null;
        }
      }),
    ).then((urls) => urls.filter((url): url is string => url !== null));
  };

  // Handle final upload (post + images)
  const handleUpload = async () => {
    if (!user || (selectedFiles.length === 0 && !caption.trim())) {
      toast.error("Please add at least one image or caption.");
      return;
    }

    setUploading(true);
    let postData = null;

    try {
      // 1. Create post (initial draft)
      postData = {
        user_id: user.id,
        content: caption.trim() || "New post",
        image_urls: null,
      };

      const { data: postResult, error: postError } = await supabase.from("posts").insert(postData).select().single();

      if (postError) throw postError;
      const post = postResult;

      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        toast.info("Uploading images...");
        // 2. Upload images and get final URLs
        imageUrls = await uploadImages(selectedFiles, post.id);

        if (imageUrls.length > 0) {
          // 3. Update post with final image URLs
          await supabase.from("posts").update({ image_urls: imageUrls }).eq("id", post.id);
        } else if (caption.trim() === "") {
          // If no images uploaded and no caption, we might want to delete the initial post,
          // but for this mock, we'll just show an error.
          toast.error("Image upload failed and post has no caption. Please try again.");
          return;
        }
      }

      toast.success("Post uploaded successfully!");

      // Reset form
      setSelectedFiles([]);
      setUploadingImages([]);
      setCaption("");

      // Notify parent and close
      onPostCreated();
      onClose();
    } catch (error) {
      console.error("Error uploading post:", error);
      toast.error("Failed to upload post");
      // Potential cleanup needed if post was created but images failed
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Only allow closing if not actively uploading
    if (uploading) {
      toast.info("Please wait for the current upload to finish.");
      return;
    }
    setSelectedFiles([]);
    setUploadingImages([]);
    setCaption("");
    onClose();
  };

  const isPostReady = selectedFiles.length > 0 || caption.trim().length > 0;
  const isAllImagesUploaded = uploadingImages.every((img) => img.uploaded);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">Create New Post</span>
            <Button
              variant="ghost"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Caption Section - Placed first for better flow */}
          <div>
            <Textarea
              placeholder="Write a caption, mention friends, and use #hashtags..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
              Your caption is searchable! Add #hashtags to categorize your post (e.g., #campusLife).
            </p>
          </div>

          {/* Image Management Section */}
          <div
            className="space-y-4 p-4 border border-dashed rounded-xl dark:border-gray-700"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                Media ({selectedFiles.length}/{MAX_FILES})
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= MAX_FILES}
                className="flex items-center gap-2 text-sm h-8"
              >
                <Upload className="w-4 h-4" />
                {selectedFiles.length > 0 ? "Add More" : "Select Images"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {uploadingImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-2">
                {uploadingImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg"
                  >
                    {/* Image Preview */}
                    <img
                      src={img.url || URL.createObjectURL(img.file)}
                      alt={`Preview ${index + 1}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${img.url ? "opacity-100" : "opacity-70 blur-sm"}`}
                    />

                    {/* Status Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      {uploading && !img.uploaded ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : img.uploaded ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <ImageIcon className="w-6 h-6 opacity-75" />
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      disabled={uploading}
                      className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full bg-red-500 hover:bg-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center p-12 text-center rounded-lg transition-all duration-300 cursor-pointer 
                  ${isDragOver ? "bg-blue-50 border-blue-500 border-2" : "bg-gray-50 dark:bg-gray-700 border-gray-300"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? "text-blue-600" : "text-gray-400"}`} />
                <p className="font-semibold text-gray-700 dark:text-gray-200">
                  {isDragOver ? "Drop your images here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG, GIF up to {MAX_FILES} files</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading} className="flex-1 font-semibold text-base">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !isPostReady}
              className="flex-1 font-semibold text-base bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {isAllImagesUploaded ? "Finalizing Post..." : "Uploading Images..."}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Post Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
