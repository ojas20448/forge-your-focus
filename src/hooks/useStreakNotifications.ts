import { useCallback } from 'react';
import { useToast } from './use-toast';

export function useStreakNotifications() {
  const { toast } = useToast();

  const scheduleStreakReminder = useCallback(() => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Calculate time until reminder (e.g., 8 PM local time)
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0); // 8 PM

    // If it's already past 8 PM, schedule for tomorrow
    if (now >= reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const msUntilReminder = reminderTime.getTime() - now.getTime();

    // Schedule notification
    setTimeout(() => {
      new Notification('🔥 Keep Your Streak Alive!', {
        body: "Don't forget to check in and focus today!",
        icon: '/favicon.ico',
        tag: 'streak-reminder',
        requireInteraction: true,
      });
    }, msUntilReminder);

    console.log(`Streak reminder scheduled for ${reminderTime.toLocaleTimeString()}`);
    return true;
  }, []);

  const sendImmediateReminder = useCallback((message: string = "Time to focus!") => {
    if (!('Notification' in window)) {
      toast({
        title: 'Reminder',
        description: message,
      });
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Xecute Reminder', {
        body: message,
        icon: '/favicon.ico',
        tag: 'focus-reminder',
      });
    } else {
      toast({
        title: 'Reminder',
        description: message,
      });
    }
  }, [toast]);

  const requestPermissionAndSchedule = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        scheduleStreakReminder();
        toast({
          title: 'Notifications Enabled',
          description: "We'll remind you to keep your streak alive!",
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [scheduleStreakReminder, toast]);

  const checkAndRemindStreak = useCallback((currentStreak: number, hasCheckedInToday: boolean) => {
    if (hasCheckedInToday) return;

    // Different messages based on streak
    let message = "Don't forget to check in today!";
    
    if (currentStreak >= 30) {
      message = `🔥 Your ${currentStreak}-day streak is at stake! Check in now!`;
    } else if (currentStreak >= 7) {
      message = `Keep your ${currentStreak}-day streak going! Time to focus.`;
    } else if (currentStreak > 0) {
      message = "Continue building your streak! Check in today.";
    }

    sendImmediateReminder(message);
  }, [sendImmediateReminder]);

  return {
    scheduleStreakReminder,
    sendImmediateReminder,
    requestPermissionAndSchedule,
    checkAndRemindStreak,
  };
}
