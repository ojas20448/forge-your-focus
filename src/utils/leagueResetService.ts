// League Reset Service - Weekly XP reset and tier promotions/demotions
// Runs every Monday at midnight to reset league standings

import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from './hapticFeedback';

interface LeagueTier {
  name: string;
  minXP: number;
  maxXP: number;
  promotionThreshold: number; // Top X% get promoted
  relegationThreshold: number; // Bottom X% get demoted
  nextTier?: string;
  previousTier?: string;
}

const LEAGUE_TIERS: Record<string, LeagueTier> = {
  bronze: {
    name: 'Bronze',
    minXP: 0,
    maxXP: 999,
    promotionThreshold: 0.3, // Top 30%
    relegationThreshold: 0, // Can't go lower
    nextTier: 'silver',
  },
  silver: {
    name: 'Silver',
    minXP: 1000,
    maxXP: 4999,
    promotionThreshold: 0.25,
    relegationThreshold: 0.2, // Bottom 20%
    nextTier: 'gold',
    previousTier: 'bronze',
  },
  gold: {
    name: 'Gold',
    minXP: 5000,
    maxXP: 14999,
    promotionThreshold: 0.2,
    relegationThreshold: 0.2,
    nextTier: 'platinum',
    previousTier: 'silver',
  },
  platinum: {
    name: 'Platinum',
    minXP: 15000,
    maxXP: 39999,
    promotionThreshold: 0.15,
    relegationThreshold: 0.15,
    nextTier: 'diamond',
    previousTier: 'gold',
  },
  diamond: {
    name: 'Diamond',
    minXP: 40000,
    maxXP: 99999,
    promotionThreshold: 0.1,
    relegationThreshold: 0.15,
    nextTier: 'master',
    previousTier: 'platinum',
  },
  master: {
    name: 'Master',
    minXP: 100000,
    maxXP: Infinity,
    promotionThreshold: 0, // Can't go higher
    relegationThreshold: 0.1,
    previousTier: 'diamond',
  },
};

class LeagueResetService {
  private resetInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the league reset service
   */
  start(): void {
    if (this.isRunning) {
      console.log('League reset service already running');
      return;
    }

    this.isRunning = true;
    console.log('League reset service started');

    // Calculate time until next Monday midnight
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);

    const timeUntilReset = nextMonday.getTime() - now.getTime();

    // Schedule first reset
    setTimeout(() => {
      this.performWeeklyReset();
      
      // Then run weekly
      this.resetInterval = setInterval(() => {
        this.performWeeklyReset();
      }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    }, timeUntilReset);
  }

  /**
   * Stop the league reset service
   */
  stop(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
    this.isRunning = false;
    console.log('League reset service stopped');
  }

  /**
   * Perform weekly league reset
   */
  async performWeeklyReset(): Promise<void> {
    try {
      console.log('Performing weekly league reset...');

      // Get all users from profiles table
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, total_xp, weekly_xp, current_league_tier');

      if (error) {
        console.error('Failed to fetch users for reset:', error);
        return;
      }

      if (!users || users.length === 0) return;

      // Note: current_league_tier is a number (0=bronze, 1=silver, etc.)
      // This service uses string keys, so for full implementation, 
      // we'd need to map tier numbers to tier names
      // For now, log that reset would happen and reset weekly XP
      
      // Reset weekly XP for all users
      const resetPromises = users.map(user =>
        supabase
          .from('profiles')
          .update({ weekly_xp: 0 })
          .eq('id', user.id)
      );

      await Promise.all(resetPromises);
      console.log(`Reset weekly XP for ${users.length} users`);

      // TODO: Implement tier promotion/relegation logic
      // This requires mapping between tier names (bronze/silver/etc) 
      // and tier numbers (0/1/etc) used in the database
      
      console.log('Weekly league reset completed');
      await hapticFeedback.trigger('success');
    } catch (error) {
      console.error('Error in league reset:', error);
    }
  }

  /**
   * Process single league tier
   * TODO: Implement promotion/relegation when tier number mapping is established
   */
  private async processLeague(tierName: string, users: any[]): Promise<void> {
    // This method is currently not used but kept for future implementation
    // When fully implementing, map between tier names and numbers
    console.log(`Would process ${users.length} users in ${tierName} league`);
  }

  /**
   * Promote user to next tier
   * TODO: Implement when tier number mapping is established
   */
  private async promoteUser(userId: string, newTierNumber: number): Promise<void> {
    await supabase
      .from('profiles')
      .update({ current_league_tier: newTierNumber })
      .eq('id', userId);

    console.log(`User ${userId} promoted to tier ${newTierNumber}`);
  }

  /**
   * Relegate user to previous tier
   * TODO: Implement when tier number mapping is established
   */
  private async relegateUser(userId: string, newTierNumber: number): Promise<void> {
    await supabase
      .from('profiles')
      .update({ current_league_tier: newTierNumber })
      .eq('id', userId);

    console.log(`User ${userId} relegated to tier ${newTierNumber}`);
  }

  /**
   * Archive weekly data for analytics
   */
  private async archiveWeeklyData(users: any[]): Promise<void> {
    // Not currently used since weekly reset is simplified
    console.log(`Would archive data for ${users.length} users`);
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualReset(): Promise<void> {
    console.log('Manual league reset triggered');
    await this.performWeeklyReset();
  }

  /**
   * Get user's league info
   */
  async getUserLeagueInfo(userId: string): Promise<any> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_league_tier, weekly_xp, total_xp')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    // Map tier number to tier name (0=bronze, 1=silver, etc.)
    const tierNumber = profile.current_league_tier || 0;
    const tierNames = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];
    const tierName = tierNames[tierNumber] || 'bronze';
    const tier = LEAGUE_TIERS[tierName];
    
    return {
      currentTier: tier.name,
      currentTierNumber: tierNumber,
      weeklyXP: profile.weekly_xp || 0,
      totalXP: profile.total_xp || 0,
      tierInfo: tier,
    };
  }
}

// Singleton instance
export const leagueResetService = new LeagueResetService();
