// Enhanced social features: leaderboards, challenges, and friend interactions
// Real-time competitive and collaborative features

import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from './hapticFeedback';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
  league_tier: string;
}

export interface FriendChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenge_type: 'streak' | 'xp_race' | 'focus_hours' | 'tasks_completed';
  target_value: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  winner_id?: string;
  challenger_progress: number;
  challenged_progress: number;
  created_at: string;
}

export interface RaidSchedule {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  scheduled_time: string;
  duration_minutes: number;
  max_participants: number;
  participants: string[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  xp_bonus: number;
}

class SocialManager {
  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        xp,
        level,
        current_streak,
        league_tier,
        profiles!inner(username, avatar_url)
      `)
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }

    return (data || []).map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.profiles?.username || 'Anonymous',
      avatar_url: entry.profiles?.avatar_url,
      xp: entry.xp,
      level: entry.level,
      rank: offset + index + 1,
      streak: entry.current_streak,
      league_tier: entry.league_tier,
    }));
  }

  /**
   * Get friends leaderboard
   */
  async getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) {
      return [];
    }

    const friendIds = friendships.map(f => f.friend_id);
    friendIds.push(userId); // Include self

    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        xp,
        level,
        current_streak,
        league_tier,
        profiles!inner(username, avatar_url)
      `)
      .in('user_id', friendIds)
      .order('xp', { ascending: false });

    if (error) {
      console.error('Failed to fetch friends leaderboard:', error);
      return [];
    }

    return (data || []).map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.profiles?.username || 'Anonymous',
      avatar_url: entry.profiles?.avatar_url,
      xp: entry.xp,
      level: entry.level,
      rank: index + 1,
      streak: entry.current_streak,
      league_tier: entry.league_tier,
    }));
  }

  /**
   * Get league leaderboard (by tier)
   */
  async getLeagueLeaderboard(leagueTier: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        xp,
        level,
        current_streak,
        league_tier,
        profiles!inner(username, avatar_url)
      `)
      .eq('league_tier', leagueTier)
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch league leaderboard:', error);
      return [];
    }

    return (data || []).map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.profiles?.username || 'Anonymous',
      avatar_url: entry.profiles?.avatar_url,
      xp: entry.xp,
      level: entry.level,
      rank: index + 1,
      streak: entry.current_streak,
      league_tier: entry.league_tier,
    }));
  }

  /**
   * Create friend challenge
   */
  async createChallenge(
    challengerId: string,
    challengedId: string,
    type: FriendChallenge['challenge_type'],
    targetValue: number,
    durationDays: number
  ): Promise<FriendChallenge | null> {
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('friend_challenges')
      .insert({
        challenger_id: challengerId,
        challenged_id: challengedId,
        challenge_type: type,
        target_value: targetValue,
        duration_days: durationDays,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending',
        challenger_progress: 0,
        challenged_progress: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create challenge:', error);
      return null;
    }

    // Trigger haptic feedback
    await hapticFeedback.trigger('success');

    // Send push notification to challenged user
    const { data: challengerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', challengerId)
      .single();

    const challengerName = challengerProfile?.display_name || 'Someone';
    const challengeTypes = {
      'streak': 'Streak Battle',
      'xp_race': 'XP Race',
      'focus_hours': 'Focus Hours',
      'tasks_completed': 'Task Marathon'
    };

    await this.sendNotification(
      challengedId,
      'challenge',
      `${challengerName} challenged you to a ${challengeTypes[type]}!`,
      `Complete ${targetValue} in ${durationDays} days`
    );

    return data;
  }

  /**
   * Accept challenge
   */
  async acceptChallenge(challengeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friend_challenges')
      .update({ status: 'active' })
      .eq('id', challengeId);

    if (!error) {
      await hapticFeedback.trigger('success');
    }

    return !error;
  }

  /**
   * Decline challenge
   */
  async declineChallenge(challengeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friend_challenges')
      .update({ status: 'declined' })
      .eq('id', challengeId);

    return !error;
  }

  /**
   * Get active challenges for user
   */
  async getUserChallenges(userId: string): Promise<FriendChallenge[]> {
    const { data, error } = await supabase
      .from('friend_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch challenges:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: number
  ): Promise<void> {
    // Determine which field to update
    const { data: challenge } = await supabase
      .from('friend_challenges')
      .select('challenger_id, challenged_id, target_value')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const isChallenger = challenge.challenger_id === userId;
    const field = isChallenger ? 'challenger_progress' : 'challenged_progress';

    // Update progress
    await supabase
      .from('friend_challenges')
      .update({ [field]: progress })
      .eq('id', challengeId);

    // Check if challenge is complete
    if (progress >= challenge.target_value) {
      await supabase
        .from('friend_challenges')
        .update({ 
          status: 'completed',
          winner_id: userId
        })
        .eq('id', challengeId);

      await hapticFeedback.trigger('achievement');
      
      // Notify the other user about the winner
      const otherUserId = challenge.challenger_id === userId ? challenge.challenged_id : challenge.challenger_id;
      const { data: winnerProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      await this.sendNotification(
        otherUserId,
        'challenge',
        `${winnerProfile?.display_name || 'Someone'} won the challenge!`,
        'Time to step up your game!'
      );
    }
  }

  /**
   * Schedule raid
   */
  async scheduleRaid(
    creatorId: string,
    title: string,
    description: string,
    scheduledTime: Date,
    durationMinutes: number,
    maxParticipants: number
  ): Promise<RaidSchedule | null> {
    const { data, error } = await supabase
      .from('raids')
      .insert({
        creator_id: creatorId,
        title,
        description,
        scheduled_time: scheduledTime.toISOString(),
        duration_minutes: durationMinutes,
        max_participants: maxParticipants,
        participants: [creatorId],
        status: 'scheduled',
        xp_bonus: Math.floor(durationMinutes / 10) * 5, // 5 XP per 10 min
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to schedule raid:', error);
      return null;
    }

    await hapticFeedback.trigger('success');
    return data;
  }

  /**
   * Join raid
   */
  async joinRaid(raidId: string, userId: string): Promise<boolean> {
    // Get current participants
    const { data: raid } = await supabase
      .from('raids')
      .select('participants, max_participants')
      .eq('id', raidId)
      .single();

    if (!raid) return false;

    // Check if raid is full
    if (raid.participants.length >= raid.max_participants) {
      return false;
    }

    // Add user to participants
    const { error } = await supabase
      .from('raids')
      .update({ 
        participants: [...raid.participants, userId] 
      })
      .eq('id', raidId);

    if (!error) {
      await hapticFeedback.trigger('success');
    }

    return !error;
  }

  /**
   * Get upcoming raids
   */
  async getUpcomingRaids(limit: number = 20): Promise<RaidSchedule[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('raids')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_time', now)
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch raids:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's raids
   */
  async getUserRaids(userId: string): Promise<RaidSchedule[]> {
    const { data, error } = await supabase
      .from('raids')
      .select('*')
      .contains('participants', [userId])
      .in('status', ['scheduled', 'active'])
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch user raids:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Start raid (for creator or auto-start at scheduled time)
   */
  async startRaid(raidId: string): Promise<boolean> {
    const { data: raid, error } = await supabase
      .from('raids')
      .update({ status: 'active' })
      .eq('id', raidId)
      .select('title, participants')
      .single();

    if (!error && raid) {
      await hapticFeedback.trigger('heavy');
      
      // Send push notifications to all participants
      const notificationPromises = raid.participants.map(participantId =>
        this.sendNotification(
          participantId,
          'raid_alert',
          `⚔️ ${raid.title} has started!`,
          'Join now and start earning XP!'
        )
      );

      await Promise.all(notificationPromises);
    }

    return !error;
  }

  /**
   * Complete raid
   */
  async completeRaid(raidId: string): Promise<boolean> {
    const { error } = await supabase
      .from('raids')
      .update({ status: 'completed' })
      .eq('id', raidId);

    if (!error) {
      await hapticFeedback.trigger('achievement');
    }

    return !error;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: fromUserId,
        friend_id: toUserId,
        status: 'pending',
      });

    if (!error) {
      const { data: fromProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', fromUserId)
        .single();

      await this.sendNotification(
        toUserId,
        'challenge',
        'New Friend Request',
        `${fromProfile?.display_name || 'Someone'} wants to be your accountability partner!`
      );
    }

    return !error;
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string, friendId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .match({ user_id: friendId, friend_id: userId });

    if (!error) {
      // Create reciprocal friendship
      await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'accepted',
        });

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      await this.sendNotification(
        friendId,
        'achievement',
        'Friend Request Accepted!',
        `${userProfile?.display_name || 'Someone'} is now your accountability partner!`
      );
    }

    return !error;
  }

  /**
   * Generate friend code for user
   */
  async generateFriendCode(userId: string): Promise<string> {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    await supabase
      .from('profiles')
      .update({ friend_code: code })
      .eq('user_id', userId);

    return code;
  }

  /**
   * Find user by friend code
   */
  async findUserByFriendCode(code: string): Promise<{ user_id: string; display_name: string } | null> {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('friend_code', code.toUpperCase())
      .single();

    return data;
  }

  /**
   * Create 1-on-1 accountability partnership
   */
  async createPartnership(
    userId1: string,
    userId2: string,
    goals: string[],
    checkInFrequency: 'daily' | 'weekly'
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('partnerships')
      .insert({
        user1_id: userId1,
        user2_id: userId2,
        goals,
        check_in_frequency: checkInFrequency,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!error) {
      await this.sendNotification(
        userId2,
        'achievement',
        'New Accountability Partnership!',
        `You're now partners! Check in ${checkInFrequency} to track progress together.`
      );
    }

    return data?.id || null;
  }

  /**
   * Start synchronized study session
   */
  async startStudyTogether(
    partnershipId: string,
    durationMinutes: number
  ): Promise<string | null> {
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('user1_id, user2_id')
      .eq('id', partnershipId)
      .single();

    if (!partnership) return null;

    // Create synchronized focus session
    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        partnership_id: partnershipId,
        scheduled_duration: durationMinutes,
        ends_at: endTime.toISOString(),
        status: 'active',
      })
      .select('id')
      .single();

    if (!error) {
      // Notify both partners
      await Promise.all([
        this.sendNotification(
          partnership.user1_id,
          'raid_alert',
          'Study Together Started!',
          `${durationMinutes}-minute synchronized session is live!`
        ),
        this.sendNotification(
          partnership.user2_id,
          'raid_alert',
          'Study Together Started!',
          `${durationMinutes}-minute synchronized session is live!`
        ),
      ]);
    }

    return data?.id || null;
  }

  /**
   * Send notification to user (helper method)
   */
  private async sendNotification(
    userId: string,
    type: 'challenge' | 'achievement' | 'raid_alert',
    title: string,
    body: string
  ): Promise<void> {
    // Store notification in database
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        read: false,
        created_at: new Date().toISOString(),
      });

    // Future: Integrate with push notification service (FCM, APNs)
    console.log(`Notification sent to ${userId}: ${title}`);
  }
}

// Singleton instance
export const socialManager = new SocialManager();
