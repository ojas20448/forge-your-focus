// Browser Push Notifications for FocusForge
// Uses native Notification API - works on all modern browsers

export type NotificationType = 'task_reminder' | 'raid_alert' | 'streak_warning' | 'challenge' | 'achievement' | 'affirmation';

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Send a notification
   */
  async send(type: NotificationType, config: NotificationConfig): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return;
      }
    }

    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon || '/icon-192x192.png',
      badge: config.badge || '/icon-72x72.png',
      tag: config.tag || type,
      requireInteraction: config.requireInteraction || false,
      data: { type }
    });

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(this.getVibrationPattern(type));
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds unless requireInteraction is true
    if (!config.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }
  }

  /**
   * Get vibration pattern based on notification type
   */
  private getVibrationPattern(type: NotificationType): number[] {
    switch (type) {
      case 'task_reminder':
        return [200, 100, 200];
      case 'raid_alert':
        return [300, 100, 300, 100, 300];
      case 'streak_warning':
        return [500, 200, 500];
      case 'challenge':
        return [100, 50, 100];
      case 'achievement':
        return [200, 50, 100, 50, 300];
      case 'affirmation':
        return [150, 75, 150];
      default:
        return [200];
    }
  }

  /**
   * Schedule a notification for later
   */
  scheduleNotification(type: NotificationType, config: NotificationConfig, delayMs: number): number {
    return window.setTimeout(() => {
      this.send(type, config);
    }, delayMs);
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduled(timerId: number): void {
    clearTimeout(timerId);
  }

  /**
   * Send task reminder notification
   */
  async sendTaskReminder(taskTitle: string, minutesBefore: number): Promise<void> {
    await this.send('task_reminder', {
      title: '🎯 Task Starting Soon',
      body: `"${taskTitle}" starts in ${minutesBefore} minutes`,
      requireInteraction: false,
      tag: 'task-reminder'
    });
  }

  /**
   * Send raid alert
   */
  async sendRaidAlert(raidName: string, message: string): Promise<void> {
    await this.send('raid_alert', {
      title: `⚔️ ${raidName} Update`,
      body: message,
      requireInteraction: true,
      tag: 'raid-alert'
    });
  }

  /**
   * Send streak warning
   */
  async sendStreakWarning(currentStreak: number, hoursRemaining: number): Promise<void> {
    await this.send('streak_warning', {
      title: '🔥 Streak at Risk!',
      body: `Your ${currentStreak}-day streak ends in ${hoursRemaining} hours. Complete a task to keep it alive!`,
      requireInteraction: true,
      tag: 'streak-warning'
    });
  }

  /**
   * Send challenge notification
   */
  async sendChallenge(): Promise<void> {
    await this.send('challenge', {
      title: '⚠️ Verification Check',
      body: 'Tap to confirm you\'re still focused',
      requireInteraction: true,
      tag: 'challenge'
    });
  }

  /**
   * Send achievement notification
   */
  async sendAchievement(title: string, description: string, xpGained: number): Promise<void> {
    await this.send('achievement', {
      title: `🏆 ${title}`,
      body: `${description} (+${xpGained} XP)`,
      requireInteraction: false,
      tag: 'achievement'
    });
  }

  /**
   * Send affirmation reminder
   */
  async sendAffirmationReminder(affirmationText: string): Promise<void> {
    await this.send('affirmation', {
      title: '✨ Affirmation Time',
      body: affirmationText.length > 60 ? affirmationText.substring(0, 60) + '...' : affirmationText,
      requireInteraction: false,
      tag: 'affirmation'
    });
  }

  /**
   * Send custom notification
   */
  async sendCustom(title: string, body: string, requireInteraction = false): Promise<void> {
    await this.send('task_reminder', {
      title,
      body,
      requireInteraction,
      tag: 'custom'
    });
  }

  /**
   * Test notification (for settings)
   */
  async sendTest(): Promise<void> {
    await this.send('task_reminder', {
      title: '✅ Notifications Working!',
      body: 'You\'ll receive reminders and alerts here',
      requireInteraction: false,
      tag: 'test'
    });
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// React hook for notifications
export const useNotifications = () => {
  const checkPermission = async (): Promise<boolean> => {
    return notificationManager.getPermissionStatus() === 'granted';
  };

  const requestPermission = async (): Promise<boolean> => {
    return await notificationManager.requestPermission();
  };

  const sendNotification = async (type: NotificationType, config: NotificationConfig) => {
    return await notificationManager.send(type, config);
  };

  return {
    isSupported: notificationManager.isSupported(),
    checkPermission,
    requestPermission,
    sendNotification,
    sendTaskReminder: notificationManager.sendTaskReminder.bind(notificationManager),
    sendRaidAlert: notificationManager.sendRaidAlert.bind(notificationManager),
    sendStreakWarning: notificationManager.sendStreakWarning.bind(notificationManager),
    sendChallenge: notificationManager.sendChallenge.bind(notificationManager),
    sendAchievement: notificationManager.sendAchievement.bind(notificationManager),
    sendAffirmationReminder: notificationManager.sendAffirmationReminder.bind(notificationManager),
    sendTest: notificationManager.sendTest.bind(notificationManager),
  };
};
