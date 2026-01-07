import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { notificationManager } from '@/utils/notificationManager';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface Affirmation {
  id: string;
  text: string;
  category: string | null;
  is_active: boolean;
  schedule_times: string[]; // Array of HH:mm times
  created_at: string;
}

export interface AffirmationSession {
  id: string;
  session_type: 'affirmation' | 'visualization' | 'journaling';
  duration_minutes: number | null;
  completed: boolean;
  journal_text: string | null;
  xp_awarded: number | null;
  created_at: string;
}

const DEFAULT_CATEGORIES = ['Success', 'Discipline', 'Confidence', 'Focus', 'Gratitude'];

export const useAffirmations = () => {
  const { user } = useAuth();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [sessions, setSessions] = useState<AffirmationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledTimers, setScheduledTimers] = useState<number[]>([]);

  // Fetch affirmations from database
  const fetchAffirmations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map(a => ({
        ...a,
        schedule_times: Array.isArray(a.schedule_times) 
          ? (a.schedule_times as string[])
          : []
      }));

      setAffirmations(parsed);
    } catch (error) {
      console.error('Error fetching affirmations:', error);
    }
  }, [user]);

  // Fetch today's sessions
  const fetchTodaySessions = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('manifestation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (error) throw error;

      setSessions((data || []).map(s => ({
        ...s,
        session_type: s.session_type as 'affirmation' | 'visualization' | 'journaling'
      })));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new affirmation
  const createAffirmation = async (
    text: string, 
    category?: string, 
    scheduleTimes?: string[]
  ): Promise<Affirmation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('affirmations')
        .insert({
          user_id: user.id,
          text,
          category: category || null,
          schedule_times: (scheduleTimes || []) as Json,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const newAffirmation: Affirmation = {
        ...data,
        schedule_times: Array.isArray(data.schedule_times) 
          ? (data.schedule_times as string[])
          : []
      };

      setAffirmations(prev => [newAffirmation, ...prev]);
      toast.success('Affirmation added!');

      // Schedule notifications for this affirmation
      if (scheduleTimes && scheduleTimes.length > 0) {
        scheduleAffirmationNotifications([newAffirmation]);
      }

      return newAffirmation;
    } catch (error) {
      console.error('Error creating affirmation:', error);
      toast.error('Failed to create affirmation');
      return null;
    }
  };

  // Update affirmation
  const updateAffirmation = async (
    id: string, 
    updates: Partial<Pick<Affirmation, 'text' | 'category' | 'is_active' | 'schedule_times'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.text !== undefined) dbUpdates.text = updates.text;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.schedule_times !== undefined) dbUpdates.schedule_times = updates.schedule_times as Json;

      const { error } = await supabase
        .from('affirmations')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAffirmations(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ));

      return true;
    } catch (error) {
      console.error('Error updating affirmation:', error);
      toast.error('Failed to update affirmation');
      return false;
    }
  };

  // Delete affirmation
  const deleteAffirmation = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('affirmations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAffirmations(prev => prev.filter(a => a.id !== id));
      toast.success('Affirmation deleted');
      return true;
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      toast.error('Failed to delete affirmation');
      return false;
    }
  };

  // Record completed session
  const recordSession = async (
    sessionType: 'affirmation' | 'visualization' | 'journaling',
    durationMinutes: number,
    journalText?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const xpReward = sessionType === 'affirmation' ? 25 : sessionType === 'visualization' ? 30 : 20;

    try {
      const { data, error } = await supabase
        .from('manifestation_sessions')
        .insert({
          user_id: user.id,
          session_type: sessionType,
          duration_minutes: durationMinutes,
          completed: true,
          journal_text: journalText || null,
          xp_awarded: xpReward
        })
        .select()
        .single();

      if (error) throw error;

      // Award XP - fetch current and update
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: (profile.total_xp || 0) + xpReward })
          .eq('user_id', user.id);
      }

      setSessions(prev => [...prev, {
        ...data,
        session_type: data.session_type as 'affirmation' | 'visualization' | 'journaling'
      }]);

      toast.success(`Session complete! +${xpReward} XP`);
      return true;
    } catch (error) {
      console.error('Error recording session:', error);
      toast.error('Failed to record session');
      return false;
    }
  };

  // Schedule notifications for affirmations
  const scheduleAffirmationNotifications = useCallback((affs: Affirmation[]) => {
    // Clear existing timers
    scheduledTimers.forEach(t => notificationManager.cancelScheduled(t));
    const newTimers: number[] = [];

    const now = new Date();
    const activeAffs = affs.filter(a => a.is_active && a.schedule_times.length > 0);

    activeAffs.forEach(aff => {
      aff.schedule_times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // If time already passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime.getTime() - now.getTime();

        const timerId = notificationManager.scheduleNotification(
          'task_reminder',
          {
            title: '✨ Affirmation Time',
            body: aff.text.length > 50 ? aff.text.substring(0, 50) + '...' : aff.text,
            requireInteraction: false,
            tag: `affirmation-${aff.id}`
          },
          delay
        );

        newTimers.push(timerId);
      });
    });

    setScheduledTimers(newTimers);
  }, [scheduledTimers]);

  // Get active affirmations
  const getActiveAffirmations = () => affirmations.filter(a => a.is_active);

  // Get today's completed session types
  const getTodayCompletedTypes = () => sessions
    .filter(s => s.completed)
    .map(s => s.session_type);

  // Check if session type is completed today
  const isSessionCompletedToday = (type: 'affirmation' | 'visualization' | 'journaling') => 
    sessions.some(s => s.session_type === type && s.completed);

  // Get categories
  const getCategories = () => {
    const customCategories = [...new Set(affirmations.map(a => a.category).filter(Boolean))];
    return [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchAffirmations();
      fetchTodaySessions();
    }
  }, [user, fetchAffirmations, fetchTodaySessions]);

  // Schedule notifications when affirmations change
  useEffect(() => {
    if (affirmations.length > 0) {
      scheduleAffirmationNotifications(affirmations);
    }
  }, [affirmations, scheduleAffirmationNotifications]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      scheduledTimers.forEach(t => notificationManager.cancelScheduled(t));
    };
  }, [scheduledTimers]);

  return {
    affirmations,
    sessions,
    loading,
    createAffirmation,
    updateAffirmation,
    deleteAffirmation,
    recordSession,
    getActiveAffirmations,
    getTodayCompletedTypes,
    isSessionCompletedToday,
    getCategories,
    refetch: () => {
      fetchAffirmations();
      fetchTodaySessions();
    }
  };
};
