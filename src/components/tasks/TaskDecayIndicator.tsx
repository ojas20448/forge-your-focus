import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDecayIndicatorProps {
  decayLevel: number;
  className?: string;
  showLabel?: boolean;
}

export const TaskDecayIndicator: React.FC<TaskDecayIndicatorProps> = ({
  decayLevel,
  className,
  showLabel = false,
}) => {
  if (decayLevel === 0) return null;

  const getDecayStatus = () => {
    if (decayLevel >= 75) return { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Critical', glow: 'shadow-destructive/50' };
    if (decayLevel >= 50) return { color: 'text-warning', bg: 'bg-warning/20', label: 'High', glow: 'shadow-warning/50' };
    if (decayLevel >= 25) return { color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Medium', glow: 'shadow-yellow-500/50' };
    return { color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Low', glow: '' };
  };

  const status = getDecayStatus();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-md",
        status.bg,
        decayLevel >= 50 && "animate-pulse"
      )}>
        <AlertTriangle className={cn("w-3 h-3", status.color)} />
        <span className={cn("text-xs font-mono-time font-bold", status.color)}>
          {decayLevel}%
        </span>
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", status.color)}>
          {status.label} Decay
        </span>
      )}
    </div>
  );
};
