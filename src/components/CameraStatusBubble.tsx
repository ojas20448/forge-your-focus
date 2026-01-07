import React from 'react';
import { Camera, CheckCircle2, XCircle, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraStatusBubbleProps {
  isActive: boolean;
  isValid: boolean;
  verificationScore?: number;
  onExpand?: () => void;
}

export const CameraStatusBubble: React.FC<CameraStatusBubbleProps> = ({
  isActive,
  isValid,
  verificationScore,
  onExpand,
}) => {
  if (!isActive) return null;

  // Determine color based on verification score
  const getStatusColor = () => {
    if (!verificationScore) {
      return isValid ? 'success' : 'accent';
    }
    if (verificationScore >= 80) return 'success';
    if (verificationScore >= 60) return 'warning';
    return 'accent';
  };

  const statusColor = getStatusColor();

  return (
    <button
      onClick={onExpand}
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm",
        statusColor === 'success' && "bg-success/20 border border-success/50",
        statusColor === 'warning' && "bg-warning/20 border border-warning/50",
        statusColor === 'accent' && "bg-accent/20 border border-accent/50 animate-pulse"
      )}
    >
      <Brain className={cn(
        "w-4 h-4",
        `text-${statusColor}`
      )} />
      
      {verificationScore !== undefined ? (
        <span className={cn(
          "text-sm font-bold font-mono-time",
          `text-${statusColor}`
        )}>
          {verificationScore}%
        </span>
      ) : (
        <>
          {isValid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-accent" />
          )}
        </>
      )}
      
      <span className={cn(
        "text-xs font-medium",
        `text-${statusColor}`
      )}>
        {statusColor === 'success' ? "Verified" : statusColor === 'warning' ? "Check focus" : "Not verified"}
      </span>
    </button>
  );
};
