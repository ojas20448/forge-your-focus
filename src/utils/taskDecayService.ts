// Background task decay automation service
// Automatically decays overdue tasks and applies penalties

import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from './hapticFeedback';

interface TaskDecayConfig {
  decayCheckInterval: number; // How often to check (milliseconds)
  decayRatePerHour: number; // How much condition degrades per hour
  rottenThreshold: number; // Below this, task is "rotten"
  maxDecay: number; // Maximum decay level (0-2: fresh, overdue, rotten)
}

const DEFAULT_CONFIG: TaskDecayConfig = {
  decayCheckInterval: 60 * 60 * 1000, // 1 hour
  decayRatePerHour: 5, // 5% per hour
  rottenThreshold: 30, // Below 30% is rotten
  maxDecay: 2, // 0=fresh, 1=overdue, 2=rotten
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

        // Calculate new condition
        const currentCondition = task.current_condition || 100;
        const decayAmount = this.calculateDecay(hoursOverdue, task.decay_rate || 1.0);
        const newCondition = Math.max(0, currentCondition - decayAmount);

        // Determine decay level
        let newDecayLevel = 0; // fresh
        if (newCondition < this.config.rottenThreshold) {
          newDecayLevel = 2; // rotten
        } else if (hoursOverdue > 24) {
          newDecayLevel = 1; // overdue
        }

        // Only update if condition or decay level changed
        if (newCondition !== currentCondition || newDecayLevel !== (task.decay_level || 0)) {
          tasksToUpdate.push({
            id: task.id,
            current_condition: Math.round(newCondition),
            decay_level: newDecayLevel,
            updated_at: now.toISOString(),
          });
          totalDecayedTasks++;
        }
      }

      // Batch update tasks
      if (tasksToUpdate.length > 0) {
        for (const taskUpdate of tasksToUpdate) {
          await supabase
            .from('tasks')
            .update({
              current_condition: taskUpdate.current_condition,
              decay_level: taskUpdate.decay_level,
              updated_at: taskUpdate.updated_at,
            })
            .eq('id', taskUpdate.id);
        }

        console.log(`Decayed ${totalDecayedTasks} tasks`);

        // Apply debt score penalty
        await this.updateDebtScore(user.id, totalDecayedTasks);

        // Trigger haptic feedback if any tasks became rotten
        const rottenTasks = tasksToUpdate.filter(t => t.decay_level === 2);
        if (rottenTasks.length > 0) {
          await hapticFeedback.trigger('warning');
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
   * Update user's debt score based on decayed tasks
   */
  private async updateDebtScore(userId: string, decayedTaskCount: number): Promise<void> {
    try {
      // Get current stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('debt_score')
        .eq('user_id', userId)
        .single();

      if (!stats) return;

      // Increase debt score (5% per decayed task, max 100%)
      const currentDebt = stats.debt_score || 0;
      const debtIncrease = Math.min(decayedTaskCount * 5, 25); // Max 25% increase per check
      const newDebt = Math.min(100, currentDebt + debtIncrease);

      if (newDebt !== currentDebt) {
        await supabase
          .from('user_stats')
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
