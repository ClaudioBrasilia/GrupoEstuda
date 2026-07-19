
import React from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className={`flex-1 px-4 pt-4 mb-2 ${hideNav ? 'pb-4' : 'pb-16'}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

export default PageLayout;
