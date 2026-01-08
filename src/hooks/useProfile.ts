import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { offlineQuery } from '@/utils/offlineWrapper';

type Profile = Tables<'profiles'>;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Use offline-first query
    const result = await offlineQuery({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      cacheKey: `profile_${user.id}`,
      fallbackData: null,
      silentFail: true,
    });

    if (result.error && !result.fromCache) {
      console.error('Error fetching profile:', result.error);
    }
    
    setProfile(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const addXp = async (amount: number) => {
    if (!profile) return;

    const newTotalXp = (profile.total_xp || 0) + amount;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    await updateProfile({
      total_xp: newTotalXp,
      level: newLevel,
    });
  };

  return {
    profile,
    loading,
    updateProfile,
    addXp,
    refetch: fetchProfile,
  };
}
