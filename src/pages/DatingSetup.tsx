import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatingProfile } from '@/hooks/useDatingProfile';
import DatingProfileForm from '@/components/dating/DatingProfileForm';
import MobileLayout from '@/components/layout/MobileLayout';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DatingSetup() {
  const navigate = useNavigate();
  const { profile, loading, upsertProfile, uploadImage } = useDatingProfile();

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dating')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              {profile ? 'Edit Dating Profile' : 'Set Up Dating Profile'}
            </h1>
          </div>

          {!loading && (
            <DatingProfileForm
              profile={profile}
              onSave={async (data) => {
                await upsertProfile(data);
                navigate('/dating');
              }}
              onUploadImage={uploadImage}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
