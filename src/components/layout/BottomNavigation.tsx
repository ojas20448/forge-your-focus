import React from 'react';
import { Home, Target, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'goals' | 'raids' | 'contracts' | 'stats' | 'settings';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems: { icon: React.ReactNode; label: string; id: TabId }[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', id: 'home' },
    { icon: <Target className="w-5 h-5" />, label: 'Goals', id: 'goals' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Progress', id: 'stats' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto safe-area-pb">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200",
                activeTab === item.id && "bg-primary/10"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                activeTab === item.id && "font-semibold"
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
