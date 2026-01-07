import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CommitmentContract {
  id: string;
  task_id: string | null;
  goal_id: string | null;
  staked_xp: number;
  buddy_email: string | null;
  buddy_user_id: string | null;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  deadline: string;
  penalty_applied: boolean;
  created_at: string;
  resolved_at: string | null;
}

interface CreateContractInput {
  taskId: string | null;
  goalId: string | null;
  stakedXp: number;
  buddyEmail: string | null;
  deadline: Date;
}

export const useCommitmentContracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<CommitmentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchContracts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('commitment_contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts((data || []) as CommitmentContract[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const createContract = useCallback(async (input: CreateContractInput): Promise<boolean> => {
    if (!user) return false;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('commitment_contracts')
        .insert({
          user_id: user.id,
          task_id: input.taskId,
          goal_id: input.goalId,
          staked_xp: input.stakedXp,
          buddy_email: input.buddyEmail,
          deadline: input.deadline.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setContracts(prev => [data as CommitmentContract, ...prev]);
      toast.success(`Contract created! ${input.stakedXp} XP at stake`);
      return true;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
      return false;
    } finally {
      setCreating(false);
    }
  }, [user]);

  const completeContract = useCallback(async (contractId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return false;

      const { error } = await supabase
        .from('commitment_contracts')
        .update({
          status: 'completed',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Award bonus XP for completing
      const bonusXp = Math.floor(contract.staked_xp * 0.2);
      
      // Get current XP and add bonus
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();
      
      await supabase
        .from('profiles')
        .update({ total_xp: (profile?.total_xp || 0) + bonusXp })
        .eq('user_id', user.id);

      setContracts(prev =>
        prev.map(c => c.id === contractId 
          ? { ...c, status: 'completed' as const, resolved_at: new Date().toISOString() } 
          : c
        )
      );

      toast.success(`Contract completed! +${bonusXp} XP bonus!`);
      return true;
    } catch (error) {
      console.error('Error completing contract:', error);
      toast.error('Failed to complete contract');
      return false;
    }
  }, [user, contracts]);

  const failContract = useCallback(async (contractId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return false;

      // Apply penalty
      const { error: updateError } = await supabase
        .from('commitment_contracts')
        .update({
          status: 'failed',
          penalty_applied: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Deduct XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      const newXp = Math.max(0, (profile?.total_xp || 0) - contract.staked_xp);
      
      await supabase
        .from('profiles')
        .update({ total_xp: newXp })
        .eq('user_id', user.id);

      setContracts(prev => 
        prev.map(c => c.id === contractId 
          ? { ...c, status: 'failed' as const, penalty_applied: true, resolved_at: new Date().toISOString() } 
          : c
        )
      );

      toast.error(`Contract failed. Lost ${contract.staked_xp} XP.`);
      return true;
    } catch (error) {
      console.error('Error failing contract:', error);
      toast.error('Failed to process contract failure');
      return false;
    }
  }, [user, contracts]);

  const cancelContract = useCallback(async (contractId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('commitment_contracts')
        .update({
          status: 'cancelled',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .eq('user_id', user.id);

      if (error) throw error;

      setContracts(prev => 
        prev.map(c => c.id === contractId 
          ? { ...c, status: 'cancelled' as const, resolved_at: new Date().toISOString() } 
          : c
        )
      );

      toast.info('Contract cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling contract:', error);
      toast.error('Failed to cancel contract');
      return false;
    }
  }, [user]);

  const getActiveContracts = useCallback(() => {
    return contracts.filter(c => c.status === 'active');
  }, [contracts]);

  const getContractForTask = useCallback((taskId: string) => {
    return contracts.find(c => c.task_id === taskId && c.status === 'active');
  }, [contracts]);

  const getContractForGoal = useCallback((goalId: string) => {
    return contracts.find(c => c.goal_id === goalId && c.status === 'active');
  }, [contracts]);

  return {
    contracts,
    loading,
    creating,
    createContract,
    completeContract,
    failContract,
    cancelContract,
    getActiveContracts,
    getContractForTask,
    getContractForGoal,
    refetch: fetchContracts,
  };
};