import React from 'react';
import { Home, Target, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'goals' | 'raids' | 'contracts' | 'stats' | 'settings';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems: { icon: React.ReactNode; label: string; id: TabId; badge?: boolean }[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', id: 'home' },
    { icon: <Target className="w-5 h-5" />, label: 'Goals', id: 'goals' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Progress', id: 'stats' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-5 py-2 rounded-2xl transition-all duration-300 relative min-w-[72px]",
                activeTab === item.id
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              )}
            >
              <div className={cn(
                "relative transition-all duration-300",
                activeTab === item.id && "drop-shadow-glow"
              )}>
                {item.icon}
                {activeTab === item.id && (
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md -z-10" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-all duration-300",
                activeTab === item.id && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
