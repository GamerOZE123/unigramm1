
import React from 'react';
import MobileNavigation from './MobileNavigation';
import MobileHeader from './MobileHeader';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
}

export default function MobileLayout({ 
  children, 
  showNavigation = true,
  showHeader = true
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <MobileHeader />}
      
      <main className={`flex-1 ${showNavigation ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {showNavigation && <MobileNavigation />}
    </div>
  );
}
