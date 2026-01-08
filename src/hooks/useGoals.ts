import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { offlineQuery } from '@/utils/offlineWrapper';

export interface DbGoal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target_date: string | null;
  progress: number | null;
  is_active: boolean | null;
  parent_goal_id: string | null;
  color: string | null;
  success_criteria: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  type: 'year' | 'month' | 'week';
  target_date?: string;
  parent_goal_id?: string;
  color?: string;
}

export const useGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setError(null);
    
    // Use offline-first query
    const result = await offlineQuery({
      queryFn: async () => {
        const { data, error: fetchError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        return data || [];
      },
      cacheKey: `goals_${user.id}`,
      fallbackData: [],
      silentFail: true,
    });

    if (result.error && !result.fromCache) {
      setError(result.error.message);
      console.error('Error fetching goals:', result.error);
      toast({
        title: 'Unable to load goals',
        description: 'Please check your connection and try again.',
        variant: 'destructive'
      });
    }

    setGoals(result.data || []);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchGoals();

    // Set up realtime subscription for goals
    if (!user) return;

    const goalsChannel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals(prev => [payload.new as DbGoal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setGoals(prev => prev.map(g => 
              g.id === payload.new.id ? payload.new as DbGoal : g
            ));
          } else if (payload.eventType === 'DELETE') {
            setGoals(prev => prev.filter(g => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
    };
  }, [fetchGoals, user]);

  const createGoal = async (input: CreateGoalInput) => {
    if (!user) return null;

    // Optimistic goal with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticGoal: DbGoal = {
      id: tempId,
      title: input.title,
      description: input.description || null,
      type: input.type,
      target_date: input.target_date || null,
      progress: 0,
      is_active: true,
      parent_goal_id: input.parent_goal_id || null,
      color: input.color || null,
      success_criteria: null,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setGoals(prev => [optimisticGoal, ...prev]);
    setMutating(true);

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...input,
          user_id: user.id,
          progress: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp goal with real one
      setGoals(prev => prev.map(g => g.id === tempId ? data : g));
      toast({
        title: 'Goal Created',
        description: `"${input.title}" has been added to your goals.`
      });
      return data;
    } catch (err) {
      // Rollback optimistic update
      setGoals(prev => prev.filter(g => g.id !== tempId));
      const message = err instanceof Error ? err.message : 'Failed to create goal';
      console.error('Error creating goal:', err);
      toast({
        title: 'Couldn\'t create goal',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setMutating(false);
    }
  };

  const updateGoal = async (id: string, updates: Partial<DbGoal>) => {
    if (!user) return false;

    // Store previous state for rollback
    const previousGoals = [...goals];
    
    // Optimistic update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    setMutating(true);

    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      // Rollback
      setGoals(previousGoals);
      const message = err instanceof Error ? err.message : 'Failed to update goal';
      console.error('Error updating goal:', err);
      toast({
        title: 'Couldn\'t update goal',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return false;

    // Store for rollback
    const goalToDelete = goals.find(g => g.id === id);
    
    // Optimistic delete
    setGoals(prev => prev.filter(g => g.id !== id));
    setMutating(true);

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Goal Deleted',
        description: 'Goal has been removed.'
      });
      return true;
    } catch (err) {
      // Rollback
      if (goalToDelete) {
        setGoals(prev => [goalToDelete, ...prev]);
      }
      const message = err instanceof Error ? err.message : 'Failed to delete goal';
      console.error('Error deleting goal:', err);
      toast({
        title: 'Couldn\'t delete goal',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    return updateGoal(id, { progress: Math.min(100, Math.max(0, progress)) });
  };

  const yearGoals = goals.filter(g => g.type === 'year');
  const monthGoals = goals.filter(g => g.type === 'month');
  const weekGoals = goals.filter(g => g.type === 'week');

  return {
    goals,
    yearGoals,
    monthGoals,
    weekGoals,
    loading,
    error,
    mutating,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    refetch: fetchGoals
  };
};
