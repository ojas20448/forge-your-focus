import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { format } from 'date-fns';

export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_completed: boolean | null;
  is_verified: boolean | null;
  goal_id: string | null;
  xp_reward: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  goal_id?: string;
  xp_reward?: number;
}

export const useTasks = (selectedDate?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('scheduled_date', dateStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, selectedDate]);

  const createTask = async (input: CreateTaskInput) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          user_id: user.id,
          is_completed: false,
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive'
      });
      return null;
    }
  };

  const createBulkTasks = async (inputs: CreateTaskInput[]) => {
    if (!user || inputs.length === 0) return [];

    try {
      const tasksToInsert = inputs.map(input => ({
        ...input,
        user_id: user.id,
        is_completed: false,
        is_verified: false,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      setTasks(prev => [...prev, ...(data || [])].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      return data || [];
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tasks',
        variant: 'destructive'
      });
      return [];
    }
  };

  const updateTask = async (id: string, updates: Partial<DbTask>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
      return false;
    }
  };

  const completeTask = async (id: string, xpEarned: number) => {
    return updateTask(id, { 
      is_completed: true, 
      xp_reward: xpEarned 
    });
  };

  return {
    tasks,
    loading,
    createTask,
    createBulkTasks,
    updateTask,
    deleteTask,
    completeTask,
    refetch: fetchTasks
  };
};
