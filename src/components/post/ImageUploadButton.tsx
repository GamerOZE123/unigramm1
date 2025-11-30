
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatePostModal from './CreatePostModal';

interface ImageUploadButtonProps {
  onPostCreated: () => void;
}

export default function ImageUploadButton({ onPostCreated }: ImageUploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      <CreatePostModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onPostCreated}
      />
    </>
  );
}
