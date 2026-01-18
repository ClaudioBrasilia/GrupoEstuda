
import React from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-16 px-4 pt-4 mb-2">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default PageLayout;
