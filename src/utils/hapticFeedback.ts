// Haptic feedback system for mobile app
// Provides tactile feedback for key interactions

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticEvent = 
  | 'light'           // Light tap (button press)
  | 'medium'          // Medium impact (toggle, swipe)
  | 'heavy'           // Heavy impact (important action)
  | 'success'         // Success feedback (task complete, achievement)
  | 'warning'         // Warning feedback (low verification score)
  | 'error'           // Error feedback (failed action)
  | 'selection'       // Selection changed
  | 'levelUp'         // Custom: Level up celebration
  | 'streak'          // Custom: Streak milestone
  | 'achievement';    // Custom: Achievement unlocked

class HapticManager {
  private enabled: boolean = true;
  private isNative: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    
    // Load user preference
    const savedPref = localStorage.getItem('haptics_enabled');
    if (savedPref !== null) {
      this.enabled = savedPref === 'true';
    }
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(event: HapticEvent): Promise<void> {
    if (!this.enabled || !this.isNative) {
      return;
    }

    try {
      switch (event) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;

        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;

        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;

        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;

        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionChanged();
          await Haptics.selectionEnd();
          break;

        case 'levelUp':
          // Custom pattern: success + heavy + success
          await Haptics.notification({ type: NotificationType.Success });
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.impact({ style: ImpactStyle.Heavy });
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case 'streak':
          // Custom pattern: medium impacts in succession
          for (let i = 0; i < 3; i++) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            await new Promise(resolve => setTimeout(resolve, 80));
          }
          break;

        case 'achievement':
          // Custom pattern: light + medium + heavy (crescendo)
          await Haptics.impact({ style: ImpactStyle.Light });
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impact({ style: ImpactStyle.Medium });
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impact({ style: ImpactStyle.Heavy });
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.notification({ type: NotificationType.Success });
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('haptics_enabled', enabled.toString());
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if running on native platform
   */
  isSupported(): boolean {
    return this.isNative;
  }

  /**
   * Vibrate with custom pattern (fallback for web)
   */
  vibratePattern(pattern: number[]): void {
    if (!this.enabled) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

// Singleton instance
export const hapticFeedback = new HapticManager();

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
  const trigger = (event: HapticEvent) => {
    hapticFeedback.trigger(event);
  };

  const toggleEnabled = () => {
    const newState = !hapticFeedback.isEnabled();
    hapticFeedback.setEnabled(newState);
    return newState;
  };

  return {
    trigger,
    isEnabled: hapticFeedback.isEnabled(),
    isSupported: hapticFeedback.isSupported(),
    toggleEnabled,
  };
}
