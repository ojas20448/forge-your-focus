import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  focus_minutes: number;
  tasks_completed: number;
  xp_earned: number;
}

export function useDailyCheckin() {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayCheckin = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle();

    setTodayCheckin(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTodayCheckin();
  }, [fetchTodayCheckin]);

  const checkIn = async () => {
    if (!user) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        checkin_date: today,
        focus_minutes: todayCheckin?.focus_minutes || 0,
        tasks_completed: todayCheckin?.tasks_completed || 0,
        xp_earned: todayCheckin?.xp_earned || 0,
      }, { onConflict: 'user_id,checkin_date' })
      .select()
      .single();

    if (!error && data) {
      setTodayCheckin(data);
    }
    
    return data;
  };

  const updateCheckin = async (updates: Partial<Pick<DailyCheckin, 'focus_minutes' | 'tasks_completed' | 'xp_earned'>>) => {
    if (!user) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // First ensure we have a checkin for today
    const currentCheckin = todayCheckin || await checkIn();
    if (!currentCheckin) return null;

    const { data, error } = await supabase
      .from('daily_checkins')
      .update({
        focus_minutes: (currentCheckin.focus_minutes || 0) + (updates.focus_minutes || 0),
        tasks_completed: (currentCheckin.tasks_completed || 0) + (updates.tasks_completed || 0),
        xp_earned: (currentCheckin.xp_earned || 0) + (updates.xp_earned || 0),
      })
      .eq('id', currentCheckin.id)
      .select()
      .single();

    if (!error && data) {
      setTodayCheckin(data);
    }
    
    return data;
  };

  return { 
    todayCheckin, 
    loading, 
    checkIn, 
    updateCheckin,
    hasCheckedInToday: !!todayCheckin,
    refetch: fetchTodayCheckin
  };
}
