import React, { useState } from 'react';
import { Plus, Calendar, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  timeOfDay: 'morning' | 'midday' | 'evening';
  onAction?: (action: string) => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    { icon: Plus, label: 'Add Task', action: 'quick-task' },
    { icon: Play, label: 'Start Focus', action: 'focus' },
    { icon: Calendar, label: 'Plan Day', action: 'plan' },
  ];

  const handleAction = (action: string) => {
    onAction?.(action);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-28 right-4 z-40">
      {/* Quick actions menu */}
      <div className={cn(
        "absolute bottom-20 right-0 flex flex-col gap-2 transition-all duration-200",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <button
            key={action.action}
            onClick={() => handleAction(action.action)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-medium shadow-lg transition-all duration-200",
              "hover:bg-secondary hover:scale-105"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <action.icon className="w-5 h-5 text-primary" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200",
          isExpanded
            ? "bg-secondary text-foreground rotate-45"
            : "bg-primary text-primary-foreground hover:scale-105"
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
