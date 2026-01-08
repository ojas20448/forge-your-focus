// Background task decay automation service
// Automatically decays overdue tasks and applies penalties

import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from './hapticFeedback';
import { notificationManager } from './notificationManager';

interface TaskDecayConfig {
  decayCheckInterval: number; // How often to check (milliseconds)
  decayRatePerHour: number; // How much condition degrades per hour
  rottenThreshold: number; // Below this, task is "rotten"
  maxDecay: number; // Maximum decay level (0-2: fresh, overdue, rotten)
  xpPenaltyPerLevel: number; // XP penalty per decay level
}

const DEFAULT_CONFIG: TaskDecayConfig = {
  decayCheckInterval: 6 * 60 * 60 * 1000, // 6 hours (as required)
  decayRatePerHour: 5, // 5% per hour
  rottenThreshold: 30, // Below 30% is rotten
  maxDecay: 2, // 0=fresh, 1=overdue, 2=rotten
  xpPenaltyPerLevel: 10, // 10 XP penalty per decay level
};

class TaskDecayService {
  private intervalId: NodeJS.Timeout | null = null;
  private config: TaskDecayConfig = DEFAULT_CONFIG;
  private isRunning = false;

  /**
   * Start the decay automation service
   */
  start(customConfig?: Partial<TaskDecayConfig>): void {
    if (this.isRunning) {
      console.log('Task decay service already running');
      return;
    }

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    this.isRunning = true;
    console.log('Task decay service started');

    // Run immediately
    this.checkAndApplyDecay();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkAndApplyDecay();
    }, this.config.decayCheckInterval);
  }

  /**
   * Stop the decay service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Task decay service stopped');
  }

  /**
   * Check and apply decay to all overdue tasks
   */
  async checkAndApplyDecay(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all incomplete tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false);

      if (error) {
        console.error('Failed to fetch tasks for decay:', error);
        return;
      }

      if (!tasks || tasks.length === 0) return;

      const now = new Date();
      const tasksToUpdate: any[] = [];
      let totalDecayedTasks = 0;

      for (const task of tasks) {
        const createdAt = new Date(task.created_at);
        const hoursOverdue = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const currentDecayLevel = task.decay_level || 0;

        // Calculate new decay level based on hours overdue
        let newDecayLevel = 0; // fresh
        if (hoursOverdue > 48) {
          newDecayLevel = 2; // rotten (>48 hours)
        } else if (hoursOverdue > 24) {
          newDecayLevel = 1; // overdue (>24 hours)
        }

        // Only update if decay level changed
        if (newDecayLevel > currentDecayLevel) {
          tasksToUpdate.push({
            id: task.id,
            title: task.title,
            decay_level: newDecayLevel,
            oldDecayLevel: currentDecayLevel,
            updated_at: now.toISOString(),
          });
          totalDecayedTasks++;
        }
      }

      // Batch update tasks
      if (tasksToUpdate.length > 0) {
        let totalXpPenalty = 0;
        const newlyRottenTasks: string[] = [];
        const tasksByLevel: { [key: number]: string[] } = { 0: [], 1: [], 2: [] };

        for (const taskUpdate of tasksToUpdate) {
          // Update task in database
          await supabase
            .from('tasks')
            .update({
              decay_level: taskUpdate.decay_level,
              updated_at: taskUpdate.updated_at,
            })
            .eq('id', taskUpdate.id);

          const oldDecayLevel = taskUpdate.oldDecayLevel || 0;
          const newDecayLevel = taskUpdate.decay_level;

          // Calculate XP penalty
          const levelIncrease = Math.max(0, newDecayLevel - oldDecayLevel);
          const penalty = levelIncrease * this.config.xpPenaltyPerLevel;
          totalXpPenalty += penalty;

          // Track newly rotten tasks for notifications
          if (newDecayLevel === 2 && oldDecayLevel < 2) {
            newlyRottenTasks.push(taskUpdate.title || 'Task');
          }

          tasksByLevel[newDecayLevel].push(taskUpdate.title || 'Task');
        }

        console.log(`Decayed ${totalDecayedTasks} tasks, XP penalty: -${totalXpPenalty}`);

        // Apply XP penalty to user
        if (totalXpPenalty > 0) {
          await this.applyXpPenalty(user.id, totalXpPenalty);
        }

        // Apply debt score penalty
        await this.updateDebtScore(user.id, totalDecayedTasks);

        // Send notifications for newly rotten tasks
        if (newlyRottenTasks.length > 0) {
          await hapticFeedback.trigger('warning');
          
          const taskList = newlyRottenTasks.slice(0, 3).join(', ');
          const more = newlyRottenTasks.length > 3 ? ` and ${newlyRottenTasks.length - 3} more` : '';
          
          await notificationManager.send('streak_warning', {
            title: '🔴 Tasks are rotting!',
            body: `${taskList}${more} ${newlyRottenTasks.length === 1 ? 'is' : 'are'} now rotten. Complete ${newlyRottenTasks.length === 1 ? 'it' : 'them'} before losing more XP!`,
            requireInteraction: true,
            tag: 'task-decay',
          });
        }

        // Warning notification for overdue tasks
        const overdueCount = tasksByLevel[1].length;
        if (overdueCount > 0 && newlyRottenTasks.length === 0) {
          await notificationManager.send('task_reminder', {
            title: '⚠️ Tasks overdue',
            body: `You have ${overdueCount} overdue ${overdueCount === 1 ? 'task' : 'tasks'}. Complete them before they rot!`,
            requireInteraction: false,
            tag: 'task-overdue',
          });
        }
      }
    } catch (error) {
      console.error('Error in decay automation:', error);
    }
  }

  /**
   * Calculate decay amount based on time overdue
   */
  private calculateDecay(hoursOverdue: number, decayRate: number): number {
    if (hoursOverdue <= 0) return 0;
    
    // Apply exponential decay curve
    const baseDecay = this.config.decayRatePerHour * decayRate;
    return baseDecay * Math.log(hoursOverdue + 1);
  }

  /**
   * Apply XP penalty for decayed tasks
   */
  private async applyXpPenalty(userId: string, xpPenalty: number): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      // Deduct XP (don't go below 0)
      const newXp = Math.max(0, (profile.total_xp || 0) - xpPenalty);

      await supabase
        .from('profiles')
        .update({ total_xp: newXp })
        .eq('user_id', userId);

      console.log(`Applied XP penalty: -${xpPenalty} XP`);
    } catch (error) {
      console.error('Failed to apply XP penalty:', error);
    }
  }

  /**
   * Update user's debt score based on decayed tasks
   */
  private async updateDebtScore(userId: string, decayedTaskCount: number): Promise<void> {
    try {
      // Get current profile with debt_score
      const { data: profile } = await supabase
        .from('profiles')
        .select('debt_score')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      // Increase debt score (5% per decayed task, max 100%)
      const currentDebt = profile.debt_score || 0;
      const debtIncrease = Math.min(decayedTaskCount * 5, 25); // Max 25% increase per check
      const newDebt = Math.min(100, currentDebt + debtIncrease);

      if (newDebt !== currentDebt) {
        await supabase
          .from('profiles')
          .update({ debt_score: newDebt })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to update debt score:', error);
    }
  }

  /**
   * Manual trigger for immediate decay check
   */
  async triggerManualCheck(): Promise<void> {
    console.log('Manual decay check triggered');
    await this.checkAndApplyDecay();
  }

  /**
   * Get service status
   */
  getStatus(): { isRunning: boolean; config: TaskDecayConfig } {
    return {
      isRunning: this.isRunning,
      config: { ...this.config },
    };
  }
}

// Singleton instance
export const taskDecayService = new TaskDecayService();
