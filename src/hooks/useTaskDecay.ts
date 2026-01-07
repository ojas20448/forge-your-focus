import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DecayEvent {
  id: string;
  task_id: string;
  previous_decay_level: number;
  new_decay_level: number;
  xp_penalty: number;
  created_at: string;
}

export interface TaskWithDecay {
  id: string;
  title: string;
  scheduled_date: string;
  end_time: string;
  is_completed: boolean;
  decay_level: number;
  decay_started_at: string | null;
}

const DECAY_LABELS = ['Fresh', 'Stale', 'Decaying', 'Rotten'] as const;
const DECAY_COLORS = ['success', 'warning', 'accent', 'destructive'] as const;

export const useTaskDecay = () => {
  const { user } = useAuth();
  const [decayEvents, setDecayEvents] = useState<DecayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecayEvents = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_decay_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDecayEvents((data || []) as DecayEvent[]);
    } catch (error) {
      console.error('Error fetching decay events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDecayEvents();
  }, [fetchDecayEvents]);

  // Calculate decay level based on time overdue
  const calculateDecayLevel = useCallback((
    scheduledDate: string,
    endTime: string,
    isCompleted: boolean
  ): number => {
    if (isCompleted) return 0;

    const now = new Date();
    const scheduled = new Date(`${scheduledDate}T${endTime}`);
    const hoursOverdue = (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);

    if (hoursOverdue < 0) return 0; // Not overdue yet
    if (hoursOverdue < 24) return 0; // Within 24 hours grace period
    if (hoursOverdue < 48) return 1; // 24-48 hours: Stale
    if (hoursOverdue < 72) return 2; // 48-72 hours: Decaying
    return 3; // 72+ hours: Rotten
  }, []);

  const getDecayLabel = useCallback((decayLevel: number): string => {
    return DECAY_LABELS[decayLevel] || 'Fresh';
  }, []);

  const getDecayColor = useCallback((decayLevel: number): string => {
    return DECAY_COLORS[decayLevel] || 'success';
  }, []);

  // Check and update decay for all overdue tasks
  const checkAndApplyDecay = useCallback(async (): Promise<{
    tasksDecayed: number;
    totalXpLost: number;
  }> => {
    if (!user) return { tasksDecayed: 0, totalXpLost: 0 };

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch incomplete tasks that are past their date
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, scheduled_date, end_time, is_completed, decay_level')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lt('scheduled_date', today);

      if (error) throw error;

      let tasksDecayed = 0;
      let totalXpLost = 0;

      for (const task of tasks || []) {
        const newDecayLevel = calculateDecayLevel(
          task.scheduled_date,
          task.end_time,
          task.is_completed || false
        );

        const currentDecay = task.decay_level || 0;
        
        if (newDecayLevel > currentDecay) {
          // Update task decay level
          const { error: updateError } = await supabase
            .from('tasks')
            .update({
              decay_level: newDecayLevel,
              decay_started_at: task.decay_level === 0 ? new Date().toISOString() : undefined,
            })
            .eq('id', task.id);

          if (!updateError) {
            tasksDecayed++;
            const xpPenalty = (newDecayLevel - currentDecay) * 10;
            totalXpLost += xpPenalty;
          }
        }
      }

      if (tasksDecayed > 0) {
        toast.warning(`${tasksDecayed} task(s) decayed. Lost ${totalXpLost} XP.`);
        await fetchDecayEvents();
      }

      return { tasksDecayed, totalXpLost };
    } catch (error) {
      console.error('Error checking decay:', error);
      return { tasksDecayed: 0, totalXpLost: 0 };
    }
  }, [user, calculateDecayLevel, fetchDecayEvents]);

  // Get total XP lost to decay
  const getTotalDecayPenalty = useCallback((): number => {
    return decayEvents.reduce((sum, event) => sum + (event.xp_penalty || 0), 0);
  }, [decayEvents]);

  // Get decay stats
  const getDecayStats = useCallback(() => {
    const stats = {
      totalEvents: decayEvents.length,
      totalXpLost: getTotalDecayPenalty(),
      rottenTasks: decayEvents.filter(e => e.new_decay_level === 3).length,
    };
    return stats;
  }, [decayEvents, getTotalDecayPenalty]);

  return {
    decayEvents,
    loading,
    calculateDecayLevel,
    getDecayLabel,
    getDecayColor,
    checkAndApplyDecay,
    getTotalDecayPenalty,
    getDecayStats,
    refetch: fetchDecayEvents,
  };
};