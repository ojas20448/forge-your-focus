import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAchievements = async () => {
      setLoading(true);
      
      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      // Fetch user's unlocked achievements
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id);

      setAchievements(allAchievements || []);
      setUserAchievements(unlocked?.map(ua => ({
        id: ua.id,
        achievement_id: ua.achievement_id,
        unlocked_at: ua.unlocked_at,
        achievement: ua.achievement as Achievement
      })) || []);
      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  return { achievements, userAchievements, loading, isUnlocked };
}
