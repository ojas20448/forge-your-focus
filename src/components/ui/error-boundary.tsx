import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button variant="outline" onClick={this.handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error message component for inline errors
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-foreground">{message}</p>
    </div>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    )}
  </div>
);

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
    {icon && (
      <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
    )}
    {action}
  </div>
);

// Offline indicator
export const OfflineIndicator: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-warning/90 text-warning-foreground px-4 py-2 text-center text-sm font-medium">
    You're offline. Changes will sync when you're back online.
  </div>
);
