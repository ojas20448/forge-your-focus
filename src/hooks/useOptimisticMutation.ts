import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface OptimisticMutationOptions<T, R> {
  mutationFn: (data: T) => Promise<R>;
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (data: T) => void;
  rollback?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<T, R = unknown>(options: OptimisticMutationOptions<T, R>) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T): Promise<R | null> => {
    setIsLoading(true);
    setError(null);

    // Apply optimistic update immediately
    options.optimisticUpdate?.(data);

    try {
      const result = await options.mutationFn(data);
      
      if (options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
        });
      }
      
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      
      // Rollback optimistic update on error
      options.rollback?.();
      
      toast({
        title: 'Error',
        description: options.errorMessage || error.message,
        variant: 'destructive',
      });
      
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    reset,
  };
}

// Hook to track online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }

  return isOnline;
}

// Pending operations queue for offline support
interface PendingOperation<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: T;
  timestamp: number;
}

const PENDING_OPS_KEY = 'xecute_pending_ops';

export function usePendingOperations() {
  const getPendingOps = (): PendingOperation[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const addPendingOp = (op: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const ops = getPendingOps();
    ops.push({
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  };

  const removePendingOp = (id: string) => {
    const ops = getPendingOps().filter(op => op.id !== id);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  };

  const clearPendingOps = () => {
    localStorage.removeItem(PENDING_OPS_KEY);
  };

  return {
    getPendingOps,
    addPendingOp,
    removePendingOp,
    clearPendingOps,
    hasPendingOps: getPendingOps().length > 0,
  };
}
