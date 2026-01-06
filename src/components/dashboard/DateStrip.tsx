import React from 'react';
import { cn } from '@/lib/utils';
import { DayStatus } from '@/types/focusforge';

interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dayStatuses: Record<string, DayStatus>;
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  onDateSelect,
  dayStatuses,
}) => {
  const today = new Date();
  
  // Generate 7 days centered on today
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 3 + i);
    return date;
  });

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  const getStatusDots = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const status = dayStatuses[dateKey];
    
    if (!status) return null;

    const dots = [];
    
    if (status.completed_sessions > 0) {
      dots.push(<div key="completed" className="w-1.5 h-1.5 rounded-full bg-success" />);
    }
    if (status.violations > 0) {
      dots.push(<div key="violations" className="w-1.5 h-1.5 rounded-full bg-accent" />);
    }
    if (status.rotten_tasks > 0) {
      dots.push(<div key="rotten" className="w-1.5 h-1.5 rounded-full bg-rotten" />);
    }
    if (status.rituals_completed > 0) {
      dots.push(<div key="rituals" className="w-1.5 h-1.5 rounded-full bg-manifestation" />);
    }

    return dots.slice(0, 3); // Max 3 dots
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-200",
              isSelected(date)
                ? "bg-primary/15 border border-primary/40"
                : "hover:bg-secondary/50",
              isToday(date) && !isSelected(date) && "bg-secondary/30"
            )}
          >
            <span className={cn(
              "text-xs font-medium",
              isSelected(date) ? "text-primary" : "text-muted-foreground"
            )}>
              {formatDay(date)}
            </span>
            <span className={cn(
              "text-lg font-bold font-mono-time",
              isSelected(date) ? "text-primary" : "text-foreground",
              isToday(date) && "text-glow-primary"
            )}>
              {date.getDate()}
            </span>
            <div className="flex items-center gap-0.5 h-2">
              {getStatusDots(date)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
