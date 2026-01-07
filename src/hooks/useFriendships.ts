import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  friend_profile?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number | null;
    total_xp: number | null;
  };
}

export interface FriendChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenge_type: string;
  target_value: number;
  current_value_challenger: number;
  current_value_challenged: number;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export const useFriendships = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  // Generate friend code from user ID (first 8 chars)
  useEffect(() => {
    if (user) {
      const code = user.id.slice(0, 8).toUpperCase();
      setFriendCode(code);
    }
  }, [user]);

  // Fetch all friendships
  const fetchFriendships = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch accepted friends - get friend profiles separately
      const { data: acceptedFriendships, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Fetch pending requests (received)
      const { data: pendingFriendships, error: pendingError } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Fetch sent requests
      const { data: sentFriendships, error: sentError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Get all unique user IDs to fetch profiles
      const allUserIds = new Set<string>();
      acceptedFriendships?.forEach(f => allUserIds.add(f.friend_id));
      pendingFriendships?.forEach(f => allUserIds.add(f.user_id));
      sentFriendships?.forEach(f => allUserIds.add(f.friend_id));

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, level, total_xp')
        .in('user_id', Array.from(allUserIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Map friendships with profiles
      const mapFriendship = (f: typeof acceptedFriendships[0], profileId: string): Friend => ({
        id: f.id,
        user_id: f.user_id,
        friend_id: f.friend_id,
        status: f.status as 'pending' | 'accepted' | 'declined',
        created_at: f.created_at,
        friend_profile: profileMap.get(profileId),
      });

      setFriends((acceptedFriendships || []).map(f => mapFriendship(f, f.friend_id)));
      setPendingRequests((pendingFriendships || []).map(f => mapFriendship(f, f.user_id)));
      setSentRequests((sentFriendships || []).map(f => mapFriendship(f, f.friend_id)));
    } catch (err) {
      console.error('Error fetching friendships:', err);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  // Send friend request by friend code
  const sendFriendRequest = async (friendCode: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setMutating(true);
    try {
      // Find user by friend code (first 8 chars of user_id)
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('user_id', `${friendCode.toLowerCase()}%`)
        .limit(1);

      if (searchError) throw searchError;

      if (!profiles || profiles.length === 0) {
        return { success: false, error: 'Friend code not found' };
      }

      const friendId = profiles[0].user_id;

      // Check if already friends or request exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already friends' };
        } else {
          return { success: false, error: 'Friend request already sent' };
        }
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (insertError) throw insertError;

      await fetchFriendships();

      toast({
        title: 'Friend request sent!',
        description: 'Waiting for them to accept',
      });

      return { success: true };
    } catch (err) {
      console.error('Error sending friend request:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send request',
      };
    } finally {
      setMutating(false);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;

    setMutating(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Create reciprocal friendship
      const request = pendingRequests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('friendships')
          .insert({
            user_id: user.id,
            friend_id: request.user_id,
            status: 'accepted',
          });
      }

      await fetchFriendships();

      toast({
        title: 'Friend added!',
        description: 'You can now challenge each other',
      });
    } catch (err) {
      console.error('Error accepting friend request:', err);
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive',
      });
    } finally {
      setMutating(false);
    }
  };

  // Decline friend request
  const declineFriendRequest = async (requestId: string) => {
    if (!user) return;

    setMutating(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      await fetchFriendships();
    } catch (err) {
      console.error('Error declining friend request:', err);
      toast({
        title: 'Error',
        description: 'Failed to decline request',
        variant: 'destructive',
      });
    } finally {
      setMutating(false);
    }
  };

  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    if (!user) return;

    setMutating(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      await fetchFriendships();

      toast({
        title: 'Friend removed',
        description: 'You are no longer friends',
      });
    } catch (err) {
      console.error('Error removing friend:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      });
    } finally {
      setMutating(false);
    }
  };

  // Create challenge
  const createChallenge = async (
    friendId: string,
    challengeType: 'focus_hours' | 'tasks_completed' | 'xp_earned',
    targetValue: number,
    durationDays: number
  ) => {
    if (!user) return { success: false };

    setMutating(true);
    try {
      const now = new Date();
      const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          challenged_id: friendId,
          challenge_type: challengeType,
          target_value: targetValue,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Challenge sent!',
        description: `${challengeType.replace('_', ' ')} challenge created`,
      });

      return { success: true };
    } catch (err) {
      console.error('Error creating challenge:', err);
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setMutating(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const friendshipsChannel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFriendships();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          fetchFriendships();
        }
      )
      .subscribe();

    return () => {
      friendshipsChannel.unsubscribe();
    };
  }, [user, fetchFriendships]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    friendCode,
    loading,
    mutating,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    createChallenge,
    refetch: fetchFriendships,
  };
};
