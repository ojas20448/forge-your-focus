import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { offlineQuery } from '@/utils/offlineWrapper';

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  target: number;
  percentage: number;
  isUnlocked: boolean;
}

export function useAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch all achievements with offline support
    const achievementsResult = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('requirement_value', { ascending: true });
        if (error) throw error;
        return data || [];
      },
      cacheKey: 'achievements_all',
      fallbackData: [],
      silentFail: true,
    });

    // Fetch user's unlocked achievements with offline support
    const unlockedResult = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', user.id);
        if (error) throw error;
        return data || [];
      },
      cacheKey: `user_achievements_${user.id}`,
      fallbackData: [],
      silentFail: true,
    });

    setAchievements(achievementsResult.data || []);
    setUserAchievements(unlockedResult.data?.map(ua => ({
      id: ua.id,
      achievement_id: ua.achievement_id,
      unlocked_at: ua.unlocked_at,
      achievement: ua.achievement as Achievement
    })) || []);
    setLoading(false);
  }, [user]);

  // Calculate achievement progress
  const calculateProgress = useCallback(async () => {
    if (!user || achievements.length === 0) return;

    const profileResult = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('total_xp, current_streak')
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        return data;
      },
      cacheKey: `profile_stats_${user.id}`,
      fallbackData: null,
      silentFail: true,
    });

    const sessionStatsResult = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('focus_sessions')
          .select('id')
          .eq('user_id', user.id);
        if (error) throw error;
        return data || [];
      },
      cacheKey: `focus_sessions_stats_${user.id}`,
      fallbackData: [],
      silentFail: true,
    });

    const taskStatsResult = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, is_completed')
          .eq('user_id', user.id)
          .eq('is_completed', true);
        if (error) throw error;
        return data || [];
      },
      cacheKey: `tasks_completed_stats_${user.id}`,
      fallbackData: [],
      silentFail: true,
    });

    const profile = profileResult.data;
    const sessionStats = sessionStatsResult.data;
    const taskStats = taskStatsResult.data;

    if (!profile) return;

    const progressData: AchievementProgress[] = achievements.map(achievement => {
      let current = 0;

      switch (achievement.requirement_type) {
        case 'total_xp':
          current = profile.total_xp || 0;
          break;
        case 'streak_days':
          current = profile.current_streak || 0;
          break;
        case 'focus_sessions':
          current = sessionStats?.length || 0;
          break;
        case 'tasks_completed':
          current = taskStats?.length || 0;
          break;
        default:
          current = 0;
      }

      return {
        achievement,
        current,
        target: achievement.requirement_value,
        percentage: Math.min((current / achievement.requirement_value) * 100, 100),
        isUnlocked: userAchievements.some(ua => ua.achievement_id === achievement.id),
      };
    });

    setProgress(progressData);
  }, [user, achievements, userAchievements]);

  // Check and unlock achievements
  const checkAchievements = useCallback(async () => {
    if (!user || progress.length === 0) return;

    const toUnlock = progress.filter(
      p => !p.isUnlocked && p.current >= p.target
    );

    for (const item of toUnlock) {
      try {
        // Unlock achievement
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: item.achievement.id,
          });

        if (error) throw error;

        // Award XP
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp, level')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const newTotalXp = (profile.total_xp || 0) + item.achievement.xp_reward;
          const newLevel = Math.floor(newTotalXp / 100) + 1;

          await supabase
            .from('profiles')
            .update({
              total_xp: newTotalXp,
              level: newLevel,
            })
            .eq('user_id', user.id);
        }

        // Show notification
        toast({
          title: '🏆 Achievement Unlocked!',
          description: `${item.achievement.name} (+${item.achievement.xp_reward} XP)`,
          duration: 5000,
        });

        // Refetch data
        await fetchAchievements();
      } catch (err) {
        console.error('Error unlocking achievement:', err);
      }
    }
  }, [user, progress, fetchAchievements, toast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const achievementsChannel = supabase
      .channel('achievements-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      achievementsChannel.unsubscribe();
    };
  }, [user, fetchAchievements]);

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievementId: string) => {
    return progress.find(p => p.achievement.id === achievementId);
  };

  return {
    achievements,
    userAchievements,
    progress,
    loading,
    isUnlocked,
    getProgress,
    refetch: fetchAchievements,
  };
}
