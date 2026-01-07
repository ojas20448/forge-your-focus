import React, { useState, useEffect } from 'react';
import { Flame, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { checkIn, hasCheckedInToday, loading } = useDailyCheckin();
  const { profile } = useProfile();
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheckIn = async () => {
    setIsChecking(true);
    await checkIn();
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  const currentStreak = profile?.current_streak || 0;
  const nextStreak = currentStreak + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="relative bg-card border border-border rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 shadow-2xl">
        {showSuccess ? (
          // Success State
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You're on fire! 🔥
            </h2>
            <p className="text-muted-foreground">
              {nextStreak} day streak! Keep it going!
            </p>
          </div>
        ) : (
          // Check-in Prompt
          <>
            {/* Decorative top */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-streak-glow to-warning flex items-center justify-center shadow-lg shadow-streak-glow/50">
                  <Flame className="w-12 h-12 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-xp-glow animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary animate-pulse delay-300" />
              </div>
            </div>

            <div className="pt-14 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Daily Check-in
              </h2>
              <p className="text-muted-foreground mb-6">
                Keep your streak alive!
              </p>

              {/* Streak Display */}
              <div className="bg-gradient-to-r from-streak-glow/10 to-warning/10 rounded-2xl p-4 mb-6 border border-streak-glow/30">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Current Streak
                    </p>
                    <p className="text-4xl font-bold text-streak-glow font-mono-time">
                      {currentStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">days</p>
                  </div>
                  <div className="w-px h-16 bg-border" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Longest
                    </p>
                    <p className="text-4xl font-bold text-foreground font-mono-time">
                      {profile?.longest_streak || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">days</p>
                  </div>
                </div>
              </div>

              {/* XP Bonus Info */}
              <div className="flex items-center justify-center gap-2 mb-6 text-sm">
                <Zap className="w-4 h-4 text-xp-glow" />
                <span className="text-muted-foreground">
                  Check in daily for{' '}
                  <span className="text-xp-glow font-semibold">bonus XP</span>
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckIn}
                  disabled={isChecking || loading}
                >
                  {isChecking ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Flame className="w-5 h-5" />
                      Check In Now
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={onClose}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
