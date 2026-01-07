import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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

  const fetchGoals = async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch goals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const createGoal = async (input: CreateGoalInput) => {
    if (!user) return null;

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

      setGoals(prev => [data, ...prev]);
      toast({
        title: 'Goal Created',
        description: `"${input.title}" has been added to your goals.`
      });
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<DbGoal>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== id));
      toast({
        title: 'Goal Deleted',
        description: 'Goal has been removed.'
      });
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive'
      });
      return false;
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
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    refetch: fetchGoals
  };
};
