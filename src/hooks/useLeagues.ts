import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface League {
  id: string;
  name: string;
  tier: number;
  min_xp: number;
  max_xp: number;
  color: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  current_league_tier: number | null;
  weekly_xp?: number;
  rank?: number;
}

export const useLeagues = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myLeague, setMyLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all leagues
  const fetchLeagues = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('leagues')
        .select('*')
        .order('tier', { ascending: true });

      if (fetchError) throw fetchError;
      setLeagues(data || []);
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leagues');
    }
  }, []);

  // Fetch leaderboard (top 100 users by XP)
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, total_xp, level, current_league_tier')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Add ranks
      const withRanks = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(withRanks);

      // Find current user's rank
      if (user) {
        const myEntry = withRanks.find(e => e.user_id === user.id);
        if (myEntry) {
          setMyRank(myEntry.rank);
        } else {
          // User not in top 100, fetch their actual rank
          const { count } = await supabase
            .from('profiles')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_xp', myEntry?.total_xp || 0);
          
          if (count !== null) {
            setMyRank(count + 1);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    }
  }, [user]);

  // Determine user's current league based on XP
  const determineUserLeague = useCallback(async () => {
    if (!user || leagues.length === 0) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, current_league_tier')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Find appropriate league based on XP
      const currentLeague = leagues.find(
        league => profile.total_xp >= league.min_xp && profile.total_xp <= league.max_xp
      );

      setMyLeague(currentLeague || null);

      // Update profile if league changed
      if (currentLeague && currentLeague.tier !== profile.current_league_tier) {
        await supabase
          .from('profiles')
          .update({ current_league_tier: currentLeague.tier })
          .eq('user_id', user.id);

        // Record in history
        await supabase
          .from('user_league_history')
          .insert({
            user_id: user.id,
            league_id: currentLeague.id,
            xp_at_entry: profile.total_xp,
          });
      }
    } catch (err) {
      console.error('Error determining league:', err);
    }
  }, [user, leagues]);

  // Fetch weekly XP leaderboard (for more competitive view)
  const fetchWeeklyLeaderboard = useCallback(async () => {
    try {
      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      // Query focus sessions from this week and sum XP per user
      const { data, error } = await supabase
        .rpc('get_weekly_leaderboard', {
          week_start: monday.toISOString(),
        });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching weekly leaderboard:', err);
      return [];
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchLeagues();
      await fetchLeaderboard();
      setLoading(false);
    };

    loadData();
  }, [fetchLeagues, fetchLeaderboard]);

  // Determine user's league once leagues are loaded
  useEffect(() => {
    determineUserLeague();
  }, [determineUserLeague]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to profile changes for real-time leaderboard updates
    const profilesChannel = supabase
      .channel('profiles-leaderboard')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          // Refetch leaderboard when any profile updates
          fetchLeaderboard();
          determineUserLeague();
        }
      )
      .subscribe();

    return () => {
      profilesChannel.unsubscribe();
    };
  }, [user, fetchLeaderboard, determineUserLeague]);

  return {
    leagues,
    leaderboard,
    myRank,
    myLeague,
    loading,
    error,
    fetchLeagues,
    fetchLeaderboard,
    fetchWeeklyLeaderboard,
    refetch: async () => {
      await fetchLeagues();
      await fetchLeaderboard();
      await determineUserLeague();
    },
  };
};
