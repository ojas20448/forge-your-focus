import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOnline: boolean;
}

/**
 * Global error boundary that catches all unhandled errors
 * Provides offline-aware error messages and recovery options
 */
export class OfflineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    // Auto-retry if error was network-related
    if (this.state.hasError && this.isNetworkError(this.state.error)) {
      this.handleReset();
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  isNetworkError = (error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkIssue = this.isNetworkError(this.state.error);

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              {isNetworkIssue && !this.state.isOnline ? (
                <WifiOff className="w-16 h-16 text-destructive animate-pulse" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-warning" />
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isNetworkIssue && !this.state.isOnline
                  ? 'You\'re Offline'
                  : 'Something Went Wrong'}
              </h1>
              <p className="text-muted-foreground">
                {isNetworkIssue && !this.state.isOnline
                  ? 'Check your internet connection and try again'
                  : 'The app encountered an unexpected error'}
              </p>
            </div>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-secondary p-4 rounded-lg text-left">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="lg"
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              {isNetworkIssue && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {this.state.isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-success" />
                      <span>Back online - tap Try Again</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span>Waiting for connection...</span>
                    </>
                  )}
                </div>
              )}

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>

            {/* Offline mode notice */}
            {!this.state.isOnline && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning">
                  <strong>Offline Mode:</strong> Some features require an internet connection.
                  Your work is saved locally and will sync when you're back online.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
