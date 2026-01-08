import { useState, useEffect, useCallback } from 'react';
import { bossBattleManager, BossBattle, Boss } from '@/utils/bossBattleManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBossBattle = () => {
  const { user } = useAuth();
  const [activeBattle, setActiveBattle] = useState<BossBattle | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalDamage: 0,
    battlesParticipated: 0,
    bossesDefeated: 0,
    lootCollected: 0,
  });
  const [leaderboard, setLeaderboard] = useState<Array<{
    user_id: string;
    username: string;
    damage: number;
    rank: number;
  }>>([]);

  // Fetch active battle
  const fetchActiveBattle = useCallback(async () => {
    setLoading(true);
    try {
      const battle = await bossBattleManager.getActiveBattle();
      setActiveBattle(battle);

      if (battle) {
        const board = await bossBattleManager.getBattleLeaderboard(battle.id);
        setLeaderboard(board);
      }
    } catch (error) {
      console.error('Failed to fetch boss battle:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const stats = await bossBattleManager.getUserBattleStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  }, [user]);

  // Attack boss
  const attackBoss = useCallback(async (focusMinutes: number) => {
    if (!user || !activeBattle) return false;

    try {
      const result = await bossBattleManager.attackBoss(
        activeBattle.id,
        user.id,
        focusMinutes
      );

      if (result) {
        toast.success(`💥 Dealt ${result.damage.toLocaleString()} damage!`, {
          description: result.phaseChanged ? '⚠️ Boss entered new phase!' : undefined,
        });

        // Refresh battle data
        await fetchActiveBattle();
        await fetchUserStats();

        if (result.newHp === 0) {
          toast.success('🎉 Boss defeated! Check your loot!', {
            duration: 5000,
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to attack boss:', error);
      toast.error('Attack failed. Please try again.');
      return false;
    }
  }, [user, activeBattle, fetchActiveBattle, fetchUserStats]);

  // Start new boss battle (admin only)
  const startWeeklyBoss = useCallback(async (bossTemplateId?: string) => {
    try {
      const battle = await bossBattleManager.startWeeklyBoss(bossTemplateId);
      if (battle) {
        toast.success('New boss battle started!');
        await fetchActiveBattle();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start boss:', error);
      toast.error('Failed to start boss battle');
      return false;
    }
  }, [fetchActiveBattle]);

  // Real-time subscription for battle updates
  useEffect(() => {
    if (!activeBattle) return;

    const channel = supabase
      .channel(`boss_battle:${activeBattle.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boss_battles',
          filter: `id=eq.${activeBattle.id}`,
        },
        (payload) => {
          console.log('Boss battle updated:', payload);
          setActiveBattle(payload.new as BossBattle);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBattle?.id]);

  // Initial load
  useEffect(() => {
    fetchActiveBattle();
    fetchUserStats();
  }, [fetchActiveBattle, fetchUserStats]);

  return {
    activeBattle,
    loading,
    userStats,
    leaderboard,
    attackBoss,
    startWeeklyBoss,
    refreshBattle: fetchActiveBattle,
  };
};
