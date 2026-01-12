import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { format } from 'date-fns';
import { offlineQuery } from '@/utils/offlineWrapper';
import {
  sortTasksByDueTime,
  getTaskUrgency,
  getTaskTimeCategory,
  validateTaskScheduling,
  hasTimeConflict,
  isTaskOverdue
} from '@/utils/taskTimeHelpers';

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
  decay_level?: number | null;
  decay_started_at?: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setError(null);

    // Use offline-first query
    const result = await offlineQuery({
      queryFn: async () => {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (selectedDate) {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          query = query.gte('scheduled_date', dateStr).lte('scheduled_date', dateStr);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        return data || [];
      },
      cacheKey: `tasks_${user.id}_${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all'}`,
      fallbackData: [],
      silentFail: true,
    });

    if (result.error && !result.fromCache) {
      setError(result.error.message);
      console.error('Error fetching tasks:', result.error);
    }

    setTasks(result.data || []);
    setLoading(false);
  }, [user, selectedDate]);

  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription for tasks
    if (!user) return;

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as DbTask].sort((a, b) => a.start_time.localeCompare(b.start_time)));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new as DbTask : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchTasks, user]);

  const createTask = async (input: CreateTaskInput) => {
    if (!user) return null;

    // Validate task scheduling
    const validation = validateTaskScheduling(input);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Task',
        description: validation.error,
        variant: 'destructive'
      });
      return null;
    }

    // Check for time conflicts
    const conflicts = tasks.filter(t => hasTimeConflict(t, input as DbTask));
    if (conflicts.length > 0) {
      toast({
        title: 'Time Conflict',
        description: `This task overlaps with "${conflicts[0].title}". Consider adjusting the time.`,
      });
      // Allow user to proceed, but warn them
    }

    // Optimistic task with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: DbTask = {
      id: tempId,
      ...input,
      description: input.description || null,
      priority: input.priority || 'medium',
      is_completed: false,
      is_verified: false,
      goal_id: input.goal_id || null,
      xp_reward: input.xp_reward || 0,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setTasks(prev => [...prev, optimisticTask].sort((a, b) => a.start_time.localeCompare(b.start_time)));
    setMutating(true);

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

      // Replace temp task with real one
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
      return data;
    } catch (err) {
      // Rollback optimistic update
      setTasks(prev => prev.filter(t => t.id !== tempId));
      const message = err instanceof Error ? err.message : 'Failed to create task';
      console.error('Error creating task:', err);
      toast({
        title: 'Couldn\'t create task',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setMutating(false);
    }
  };

  const createBulkTasks = async (inputs: CreateTaskInput[]) => {
    if (!user || inputs.length === 0) return [];

    setMutating(true);
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
      toast({
        title: 'Tasks created',
        description: `${data?.length || 0} tasks added to your schedule.`
      });
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tasks';
      console.error('Error creating tasks:', err);
      toast({
        title: 'Couldn\'t create tasks',
        description: message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setMutating(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<DbTask>) => {
    if (!user) return false;

    // Store previous state for rollback
    const previousTasks = [...tasks];

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setMutating(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      // Rollback
      setTasks(previousTasks);
      const message = err instanceof Error ? err.message : 'Failed to update task';
      console.error('Error updating task:', err);
      toast({
        title: 'Couldn\'t update task',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return false;

    // Store for rollback
    const taskToDelete = tasks.find(t => t.id === id);

    // Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== id));
    setMutating(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Task deleted',
        description: 'Task has been removed.'
      });
      return true;
    } catch (err) {
      // Rollback
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      }
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      console.error('Error deleting task:', err);
      toast({
        title: 'Couldn\'t delete task',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const completeTask = async (id: string, xpEarned: number) => {
    return updateTask(id, {
      is_completed: true,
      xp_reward: xpEarned
    });
  };

  // Computed properties with time-based logic
  const sortedTasks = useMemo(() =>
    sortTasksByDueTime(tasks),
    [tasks]
  );

  const overdueTasks = useMemo(() =>
    tasks.filter(t => isTaskOverdue(t)),
    [tasks]
  );

  const todayTasks = useMemo(() =>
    tasks.filter(t => getTaskTimeCategory(t) === 'due_today'),
    [tasks]
  );

  const upcomingTasks = useMemo(() =>
    tasks.filter(t => getTaskTimeCategory(t) === 'due_this_week'),
    [tasks]
  );

  const tasksByUrgency = useMemo(() => {
    const categorized = {
      critical: tasks.filter(t => getTaskUrgency(t) === 'critical'),
      high: tasks.filter(t => getTaskUrgency(t) === 'high'),
      medium: tasks.filter(t => getTaskUrgency(t) === 'medium'),
      low: tasks.filter(t => getTaskUrgency(t) === 'low'),
    };
    return categorized;
  }, [tasks]);

  return {
    tasks: sortedTasks, // Return sorted tasks by default
    rawTasks: tasks, // Original unsorted tasks
    overdueTasks,
    todayTasks,
    upcomingTasks,
    tasksByUrgency,
    loading,
    error,
    mutating,
    createTask,
    createBulkTasks,
    updateTask,
    deleteTask,
    completeTask,
    refetch: fetchTasks
  };
};
