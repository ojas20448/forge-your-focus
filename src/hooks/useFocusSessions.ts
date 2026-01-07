import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CreateFocusSessionInput {
  task_id?: string;
  planned_duration_minutes: number;
  actual_duration_minutes?: number;
  was_completed?: boolean;
  xp_earned?: number;
  break_count?: number;
  total_break_minutes?: number;
}

export const useFocusSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const saveFocusSession = async (input: CreateFocusSessionInput) => {
    if (!user) return null;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          task_id: input.task_id || null,
          start_time: new Date(Date.now() - (input.actual_duration_minutes || input.planned_duration_minutes) * 60 * 1000).toISOString(),
          end_time: new Date().toISOString(),
          planned_duration_minutes: input.planned_duration_minutes,
          actual_duration_minutes: input.actual_duration_minutes || input.planned_duration_minutes,
          was_completed: input.was_completed ?? true,
          xp_earned: input.xp_earned || 0,
          break_count: input.break_count || 0,
          total_break_minutes: input.total_break_minutes || 0,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving focus session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save focus session',
        variant: 'destructive'
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateUserXP = async (xpToAdd: number) => {
    if (!user) return;

    try {
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentXP = profile?.total_xp || 0;
      const newXP = currentXP + xpToAdd;
      
      // Simple level calculation: level up every 1000 XP
      const newLevel = Math.floor(newXP / 1000) + 1;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          total_xp: newXP,
          level: newLevel
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating XP:', error);
    }
  };

  return {
    saveFocusSession,
    updateUserXP,
    saving
  };
};
