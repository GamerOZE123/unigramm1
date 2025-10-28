import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightSidebar from './RightSidebar';
import MobileNavigation from './MobileNavigation';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export default function Layout({ children, rightSidebar }: LayoutProps) {
  const location = useLocation();
  const showRightSidebar = location.pathname === '/' || location.pathname === '/home' || location.pathname.startsWith('/post/');
  const hasCustomSidebar = !!rightSidebar;
  const isFitnessPage = location.pathname === '/fitness';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on fitness page */}
      {!isFitnessPage && <Sidebar />}
      
      
      {/* Main Content */}
      <main className={`${!isFitnessPage ? 'md:ml-64' : ''} ${!isFitnessPage ? 'pb-20 md:pb-6' : ''} ${(showRightSidebar || hasCustomSidebar) && !isFitnessPage ? 'xl:mr-80' : ''}`}>
        {!isFitnessPage && (
          <div
            className="container mx-auto px-4 py-2"
            style={{
              paddingLeft: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingTop: 0,
            }}
          >
            {children}
          </div>
        )}
        {isFitnessPage && children}
      </main>
      
      {/* Right Sidebar - default or custom */}
      {!isFitnessPage && (hasCustomSidebar ? (
        <div className="hidden xl:block fixed right-0 top-0 h-screen w-80 border-l bg-card overflow-y-auto p-4">
          {rightSidebar}
        </div>
      ) : showRightSidebar && <RightSidebar />)}
      
      {/* Mobile Navigation - hidden on fitness page */}
      {!isFitnessPage && <MobileNavigation />}
    </div>
  );
}
