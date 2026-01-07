import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DbRaid {
  id: string;
  name: string;
  description: string | null;
  target_hours: number;
  current_hours: number;
  reward: string | null;
  starts_at: string;
  ends_at: string;
  created_by: string;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface RaidMember {
  id: string;
  raid_id: string;
  user_id: string;
  xp_contributed: number;
  focus_hours: number;
  joined_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateRaidInput {
  name: string;
  description?: string;
  target_hours: number;
  ends_at: string;
  reward?: string;
}

export const useRaids = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [raids, setRaids] = useState<DbRaid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchRaids = useCallback(async () => {
    if (!user) {
      setRaids([]);
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('raids')
        .select('*')
        .eq('is_active', true)
        .order('ends_at', { ascending: true });

      if (fetchError) throw fetchError;
      setRaids(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch raids';
      console.error('Error fetching raids:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRaids();

    // Set up realtime subscriptions
    if (!user) return;

    const raidsChannel = supabase
      .channel('raids-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raids'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRaids(prev => [payload.new as DbRaid, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRaids(prev => prev.map(r => 
              r.id === payload.new.id ? payload.new as DbRaid : r
            ));
          } else if (payload.eventType === 'DELETE') {
            setRaids(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(raidsChannel);
    };
  }, [user, fetchRaids]);

  const createRaid = async (input: CreateRaidInput) => {
    if (!user) return null;

    setMutating(true);
    try {
      // Create the raid
      const { data: raid, error: raidError } = await supabase
        .from('raids')
        .insert({
          ...input,
          created_by: user.id,
          current_hours: 0,
          is_active: true,
        })
        .select()
        .single();

      if (raidError) throw raidError;

      // Auto-join the creator as a member
      const { error: memberError } = await supabase
        .from('raid_members')
        .insert({
          raid_id: raid.id,
          user_id: user.id,
          xp_contributed: 0,
          focus_hours: 0,
        });

      if (memberError) throw memberError;

      setRaids(prev => [raid, ...prev]);
      toast({
        title: 'Raid Created',
        description: `"${input.name}" raid is now active!`
      });
      return raid;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create raid';
      console.error('Error creating raid:', err);
      toast({
        title: 'Couldn\'t create raid',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setMutating(false);
    }
  };

  const joinRaid = async (raidId: string) => {
    if (!user) return false;

    setMutating(true);
    try {
      const { error } = await supabase
        .from('raid_members')
        .insert({
          raid_id: raidId,
          user_id: user.id,
          xp_contributed: 0,
          focus_hours: 0,
        });

      if (error) throw error;

      toast({
        title: 'Joined Raid',
        description: 'You have joined the raid!'
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join raid';
      console.error('Error joining raid:', err);
      toast({
        title: 'Couldn\'t join raid',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const leaveRaid = async (raidId: string) => {
    if (!user) return false;

    setMutating(true);
    try {
      const { error } = await supabase
        .from('raid_members')
        .delete()
        .eq('raid_id', raidId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Left Raid',
        description: 'You have left the raid.'
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave raid';
      console.error('Error leaving raid:', err);
      toast({
        title: 'Couldn\'t leave raid',
        description: message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setMutating(false);
    }
  };

  const getRaidMembers = async (raidId: string): Promise<RaidMember[]> => {
    try {
      const { data, error } = await supabase
        .from('raid_members')
        .select('*')
        .eq('raid_id', raidId)
        .order('xp_contributed', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching raid members:', err);
      toast({
        title: 'Couldn\'t load leaderboard',
        description: 'Please try again.',
        variant: 'destructive'
      });
      return [];
    }
  };

  const contributeToRaid = async (raidId: string, hours: number, xp: number) => {
    if (!user) return false;

    setMutating(true);
    try {
      // Update member contribution
      const { data: member, error: memberFetchError } = await supabase
        .from('raid_members')
        .select('*')
        .eq('raid_id', raidId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberFetchError) throw memberFetchError;

      if (member) {
        const { error: memberUpdateError } = await supabase
          .from('raid_members')
          .update({
            focus_hours: member.focus_hours + hours,
            xp_contributed: member.xp_contributed + xp,
          })
          .eq('id', member.id);

        if (memberUpdateError) throw memberUpdateError;
      }

      // Update raid total hours
      const raid = raids.find(r => r.id === raidId);
      if (raid) {
        const { error: raidUpdateError } = await supabase
          .from('raids')
          .update({
            current_hours: raid.current_hours + Math.ceil(hours),
          })
          .eq('id', raidId);

        if (raidUpdateError) throw raidUpdateError;

        setRaids(prev => prev.map(r => 
          r.id === raidId 
            ? { ...r, current_hours: r.current_hours + Math.ceil(hours) }
            : r
        ));
      }

      return true;
    } catch (err) {
      console.error('Error contributing to raid:', err);
      return false;
    } finally {
      setMutating(false);
    }
  };

  return {
    raids,
    loading,
    error,
    mutating,
    createRaid,
    joinRaid,
    leaveRaid,
    getRaidMembers,
    contributeToRaid,
    refetch: fetchRaids
  };
};
