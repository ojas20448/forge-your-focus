import React, { useState } from 'react';
import { Plus, Calendar, Play, Moon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  timeOfDay: 'morning' | 'midday' | 'evening';
  onAction?: (action: string) => void;
}

const timeActions = {
  morning: { icon: Calendar, label: 'Plan Day', action: 'plan' },
  midday: { icon: Play, label: 'Start Focus', action: 'focus' },
  evening: { icon: Moon, label: 'Review & Lock', action: 'review' },
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  timeOfDay,
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const primaryAction = timeActions[timeOfDay];
  const PrimaryIcon = primaryAction.icon;

  const quickActions = [
    { icon: Calendar, label: 'Quick Task', action: 'quick-task' },
    { icon: Play, label: 'Focus Now', action: 'focus-now' },
  ];

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* Quick actions */}
      <div className={cn(
        "absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <button
            key={action.action}
            onClick={() => {
              onAction?.(action.action);
              setIsExpanded(false);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium shadow-lg transition-all duration-300",
              "hover:bg-secondary/80 hover:border-primary/30",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => {
          if (isExpanded) {
            setIsExpanded(false);
          } else {
            onAction?.(primaryAction.action);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300",
          "bg-primary text-primary-foreground glow-primary",
          "hover:scale-105 active:scale-95",
          isExpanded && "rotate-45 bg-secondary text-foreground shadow-none"
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <PrimaryIcon className="w-6 h-6" />
        )}
      </button>

      {/* Context label */}
      {!isExpanded && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full">
          <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium text-foreground whitespace-nowrap shadow-lg">
            {primaryAction.label}
          </span>
        </div>
      )}
    </div>
  );
};
