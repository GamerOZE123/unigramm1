import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ClubsPage from '@/components/university/ClubsPage';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from '@/components/layout/MobileHeader';

export default function Clubs() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6 px-4 pt-4 pb-20 md:pb-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/university')}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Clubs & Organizations</h1>
                <p className="text-sm text-muted-foreground hidden md:block">Discover and join university clubs</p>
              </div>
            </div>
          </div>
        </div>
        
        <ClubsPage />
      </div>
    </Layout>
  );
}
