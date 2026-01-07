import React from 'react';
import { Clock, Skull, AlertTriangle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecayIndicatorProps {
  decayLevel: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DECAY_CONFIG = [
  { 
    icon: Leaf, 
    label: 'Fresh', 
    color: 'text-success', 
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30' 
  },
  { 
    icon: Clock, 
    label: 'Stale', 
    color: 'text-warning', 
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30' 
  },
  { 
    icon: AlertTriangle, 
    label: 'Decaying', 
    color: 'text-accent', 
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30' 
  },
  { 
    icon: Skull, 
    label: 'Rotten', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30' 
  },
];

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const containerSizes = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

export const DecayIndicator: React.FC<DecayIndicatorProps> = ({
  decayLevel,
  showLabel = true,
  size = 'sm',
}) => {
  const config = DECAY_CONFIG[Math.min(decayLevel, 3)];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border font-medium",
      config.bgColor,
      config.borderColor,
      containerSizes[size]
    )}>
      <Icon className={cn(sizeClasses[size], config.color)} />
      {showLabel && (
        <span className={config.color}>{config.label}</span>
      )}
    </div>
  );
};

// Progress bar showing decay progression
export const DecayProgressBar: React.FC<{
  decayLevel: number;
  className?: string;
}> = ({ decayLevel, className }) => {
  const progress = (decayLevel / 3) * 100;
  
  const getColorClass = () => {
    if (decayLevel === 0) return 'bg-success';
    if (decayLevel === 1) return 'bg-warning';
    if (decayLevel === 2) return 'bg-accent';
    return 'bg-destructive';
  };

  return (
    <div className={cn("h-1.5 bg-secondary rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all duration-500", getColorClass())}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};