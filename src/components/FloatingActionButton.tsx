import React, { useState } from 'react';
import { Plus, Calendar, Play, Moon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  timeOfDay: 'morning' | 'midday' | 'evening';
  onAction?: (action: string) => void;
}

const timeActions = {
  morning: { icon: Plus, label: 'Add Task', action: 'quick-task' },
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
    { icon: Plus, label: 'Quick Task', action: 'quick-task' },
    { icon: Calendar, label: 'Plan Day', action: 'plan' },
  ];

  return (
    <div className="fixed bottom-28 right-6 z-40">
      {/* Quick actions */}
      <div className={cn(
        "absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300",
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
              "flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/95 backdrop-blur-md border border-border/50 text-foreground text-sm font-semibold shadow-2xl transition-all duration-300",
              "hover:bg-card hover:border-primary/40 hover:scale-105",
              "animate-fade-in"
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
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300",
          "bg-primary text-primary-foreground glow-primary",
          "hover:scale-110 active:scale-95",
          "border-2 border-primary/20",
          isExpanded && "rotate-45 bg-secondary text-foreground shadow-lg scale-95"
        )}
      >
        {isExpanded ? (
          <X className="w-7 h-7" />
        ) : (
          <PrimaryIcon className="w-7 h-7" />
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
