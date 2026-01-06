import React from 'react';
import { Coffee, Timer } from 'lucide-react';

interface BreakBlockProps {
  duration: number;
  startTime: string;
  endTime: string;
}

export const BreakBlock: React.FC<BreakBlockProps> = ({
  duration,
  startTime,
  endTime,
}) => {
  return (
    <div className="ml-14 mr-4 my-2">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-dashed border-border/50">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Coffee className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Timer className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {duration} min break
            </span>
          </div>
          <span className="text-[10px] font-mono-time text-muted-foreground/70">
            {startTime} - {endTime}
          </span>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground">
          Recovery
        </span>
      </div>
    </div>
  );
};
