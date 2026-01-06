import React from 'react';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-accent/3 rounded-full blur-3xl" />
      </div>
      
      {/* Main content */}
      <main className="flex-1 relative z-10 pb-20 overflow-y-auto scrollbar-hide">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
};
