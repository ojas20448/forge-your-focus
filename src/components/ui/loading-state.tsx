import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className,
  fullScreen = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreen ? 'min-h-screen' : 'h-64',
        className
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
};
