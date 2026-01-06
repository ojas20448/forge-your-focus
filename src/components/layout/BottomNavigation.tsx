import React from 'react';
import { Home, Target, Trophy, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  active?: boolean;
}

export const BottomNavigation: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('home');

  const navItems: NavItem[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Timeline', id: 'home' },
    { icon: <Target className="w-5 h-5" />, label: 'Goals', id: 'goals' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Raids', id: 'raids' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Stats', id: 'stats' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                activeTab === item.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <span className={cn(
                "transition-transform duration-200",
                activeTab === item.id && "scale-110"
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
