import React from 'react';
import { cn } from '@/lib/utils';

interface TimeSpineProps {
  currentTimePercent: number; // 0-100 representing current time position in day
}

export const TimeSpine: React.FC<TimeSpineProps> = ({ currentTimePercent }) => {
  return (
    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/30">
      {/* Current time indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent glow-accent z-10 animate-glow-pulse"
        style={{ top: `${currentTimePercent}%` }}
      >
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-accent/50 animate-ping" />
      </div>
      
      {/* Glow effect on current position */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-8 h-20 blur-xl bg-primary/30"
        style={{ top: `calc(${currentTimePercent}% - 40px)` }}
      />
    </div>
  );
};

interface TimeMarkerProps {
  time: string;
  isCurrentHour?: boolean;
}

export const TimeMarker: React.FC<TimeMarkerProps> = ({ time, isCurrentHour }) => {
  return (
    <div className={cn(
      "flex items-center gap-3",
      isCurrentHour && "text-primary"
    )}>
      <span className={cn(
        "text-xs font-mono-time w-10 text-right",
        isCurrentHour ? "text-primary font-bold" : "text-muted-foreground"
      )}>
        {time}
      </span>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isCurrentHour ? "bg-primary glow-primary" : "bg-secondary"
      )} />
    </div>
  );
};
