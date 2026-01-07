import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChallengeRecord {
  id: string;
  challenge_type: string;
  was_passed: boolean;
  response_time_ms: number;
  created_at: string;
}

export const useAntiCheat = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const recordChallenge = useCallback(async (
    focusSessionId: string | null,
    challengeType: string,
    challengeData: Record<string, unknown>,
    wasPassed: boolean,
    responseTimeMs: number
  ): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      // Use type assertion to handle the new table not yet in generated types
      const insertData = {
        user_id: user.id,
        focus_session_id: focusSessionId,
        challenge_type: challengeType,
        challenge_data: challengeData,
        was_passed: wasPassed,
        response_time_ms: responseTimeMs,
        answered_at: new Date().toISOString(),
      };
      
      const { error } = await (supabase
        .from('anti_cheat_challenges' as 'achievements') as unknown as ReturnType<typeof supabase.from>)
        .insert(insertData);

      if (error) throw error;

      if (wasPassed) {
        toast.success('Challenge passed! +10 XP bonus');
      } else {
        toast.error('Challenge failed - verification warning added');
      }

      return true;
    } catch (error) {
      console.error('Error recording challenge:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const getChallengeStats = useCallback(async (): Promise<{
    totalChallenges: number;
    passedChallenges: number;
    averageResponseTime: number;
  }> => {
    if (!user) return { totalChallenges: 0, passedChallenges: 0, averageResponseTime: 0 };

    try {
      const { data, error } = await (supabase
        .from('anti_cheat_challenges' as 'achievements') as unknown as ReturnType<typeof supabase.from>)
        .select('was_passed, response_time_ms')
        .eq('user_id', user.id);

      if (error) throw error;

      const challenges = data || [];
      const passed = challenges.filter(c => c.was_passed).length;
      const totalTime = challenges.reduce((sum, c) => sum + (c.response_time_ms || 0), 0);

      return {
        totalChallenges: challenges.length,
        passedChallenges: passed,
        averageResponseTime: challenges.length > 0 ? Math.round(totalTime / challenges.length) : 0,
      };
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      return { totalChallenges: 0, passedChallenges: 0, averageResponseTime: 0 };
    }
  }, [user]);

  return {
    recordChallenge,
    getChallengeStats,
    saving,
  };
};