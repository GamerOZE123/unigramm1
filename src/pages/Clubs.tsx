import React from 'react';
import Layout from '@/components/layout/Layout';
import ClubsPage from '@/components/university/ClubsPage';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from '@/components/layout/MobileHeader';

export default function Clubs() {
  const isMobile = useIsMobile();

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="px-4 pt-4 pb-20 md:pb-6">
        <ClubsPage />
      </div>
    </Layout>
  );
}
