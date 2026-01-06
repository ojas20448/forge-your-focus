import React from 'react';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraStatusBubbleProps {
  isActive: boolean;
  isValid: boolean;
  onExpand?: () => void;
}

export const CameraStatusBubble: React.FC<CameraStatusBubbleProps> = ({
  isActive,
  isValid,
  onExpand,
}) => {
  if (!isActive) return null;

  return (
    <button
      onClick={onExpand}
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300",
        isValid 
          ? "bg-success/20 border border-success/50" 
          : "bg-accent/20 border border-accent/50 animate-pulse"
      )}
    >
      <Camera className={cn(
        "w-4 h-4",
        isValid ? "text-success" : "text-accent"
      )} />
      {isValid ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-accent" />
      )}
      <span className={cn(
        "text-xs font-medium",
        isValid ? "text-success" : "text-accent"
      )}>
        {isValid ? "Verified" : "Check position"}
      </span>
    </button>
  );
};
