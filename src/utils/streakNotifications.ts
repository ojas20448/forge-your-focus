// Streak notification service
// Sends push notifications for streak maintenance and warnings

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

interface StreakNotificationConfig {
  morningReminder: boolean;
  morningTime: string; // "08:00"
  eveningWarning: boolean;
  eveningTime: string; // "20:00"
  urgentWarning: boolean;
  urgentTime: string; // "23:00"
}

const DEFAULT_CONFIG: StreakNotificationConfig = {
  morningReminder: true,
  morningTime: '08:00',
  eveningWarning: true,
  eveningTime: '20:00',
  urgentWarning: true,
  urgentTime: '23:00',
};

class StreakNotificationService {
  private config: StreakNotificationConfig = DEFAULT_CONFIG;
  private isNative = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.loadConfig();
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (!this.isNative) {
      console.log('Notifications not available on web platform');
      return;
    }

    try {
      // Request permissions
      const result = await LocalNotifications.requestPermissions();
      
      if (result.display !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Schedule daily notifications
      await this.scheduleAllNotifications();
      
      console.log('Streak notifications initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Schedule all streak notifications
   */
  async scheduleAllNotifications(): Promise<void> {
    if (!this.isNative) return;

    const notifications: ScheduleOptions[] = [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's current streak
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    const currentStreak = stats?.current_streak || 0;

    // Morning reminder
    if (this.config.morningReminder) {
      const [hours, minutes] = this.config.morningTime.split(':').map(Number);
      notifications.push({
        id: 1,
        title: currentStreak > 0 ? `${currentStreak} Day Streak! 🔥` : 'Start Your Day!',
        body: currentStreak > 0 
          ? 'Keep your streak alive! Complete your first task today.' 
          : 'Begin your productivity journey today!',
        schedule: {
          on: { hour: hours, minute: minutes },
          repeats: true,
          allowWhileIdle: true,
        },
      });
    }

    // Evening warning
    if (this.config.eveningWarning) {
      const [hours, minutes] = this.config.eveningTime.split(':').map(Number);
      notifications.push({
        id: 2,
        title: 'Check Your Progress 📊',
        body: currentStreak > 0
          ? `Don't lose your ${currentStreak}-day streak! Complete your tasks.`
          : 'How are your tasks coming along?',
        schedule: {
          on: { hour: hours, minute: minutes },
          repeats: true,
          allowWhileIdle: true,
        },
      });
    }

    // Urgent warning
    if (this.config.urgentWarning) {
      const [hours, minutes] = this.config.urgentTime.split(':').map(Number);
      notifications.push({
        id: 3,
        title: '⚠️ Streak at Risk!',
        body: currentStreak > 0
          ? `Only 1 hour left! Your ${currentStreak}-day streak is at risk.`
          : 'Last chance to complete your tasks today!',
        schedule: {
          on: { hour: hours, minute: minutes },
          repeats: true,
          allowWhileIdle: true,
        },
      });
    }

    // Cancel existing and schedule new
    await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Scheduled ${notifications.length} streak notifications`);
    }
  }

  /**
   * Send immediate streak milestone notification
   */
  async sendMilestoneNotification(streak: number): Promise<void> {
    if (!this.isNative) return;

    let title = '';
    let body = '';

    if (streak === 7) {
      title = '🎉 Week Warrior!';
      body = '7 days straight! You\'re on fire!';
    } else if (streak === 30) {
      title = '⚡ Month Master!';
      body = '30 days! Incredible dedication!';
    } else if (streak === 100) {
      title = '💯 Century Champion!';
      body = '100 days! You\'re a legend!';
    } else if (streak % 10 === 0) {
      title = `${streak} Day Streak! 🔥`;
      body = 'Keep the momentum going!';
    } else {
      return; // Don't send for non-milestones
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
      }]
    });
  }

  /**
   * Send streak lost notification
   */
  async sendStreakLostNotification(lostStreak: number): Promise<void> {
    if (!this.isNative) return;

    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title: '💔 Streak Lost',
        body: `You lost your ${lostStreak}-day streak. Start fresh today!`,
        schedule: { at: new Date(Date.now() + 1000) },
      }]
    });
  }

  /**
   * Update notification config
   */
  async updateConfig(newConfig: Partial<StreakNotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // Reschedule with new times
    await this.scheduleAllNotifications();
  }

  /**
   * Load config from storage
   */
  private loadConfig(): void {
    const saved = localStorage.getItem('streak_notifications_config');
    if (saved) {
      try {
        this.config = { ...this.config, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load notification config:', error);
      }
    }
  }

  /**
   * Save config to storage
   */
  private saveConfig(): void {
    localStorage.setItem('streak_notifications_config', JSON.stringify(this.config));
  }

  /**
   * Get current config
   */
  getConfig(): StreakNotificationConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable all notifications
   */
  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.scheduleAllNotifications();
    } else {
      if (this.isNative) {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
      }
    }
  }
}

// Singleton instance
export const streakNotifications = new StreakNotificationService();
