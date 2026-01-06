import React, { useState, useEffect } from 'react';
import { Camera, Pause, Play, SkipForward, AlertTriangle, CheckCircle2, X, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task } from '@/types/focusforge';

interface FocusSessionScreenProps {
  task: Task;
  onEnd: () => void;
  onPause: () => void;
}

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({
  task,
  onEnd,
  onPause,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(task.duration_min * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [verificationWarnings, setVerificationWarnings] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (isPaused || showChallenge) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        // Earn XP every second when verified
        if (isVerified) {
          setXpEarned(p => p + 0.05);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, showChallenge, isVerified]);

  // Simulate random challenges
  useEffect(() => {
    if (!task.verification_required) return;
    
    const challengeInterval = setInterval(() => {
      if (!isPaused && Math.random() > 0.7) {
        setShowChallenge(true);
      }
    }, 30000); // Every 30 seconds, 30% chance

    return () => clearInterval(challengeInterval);
  }, [isPaused, task.verification_required]);

  // Simulate verification status changes
  useEffect(() => {
    if (!task.verification_required) return;

    const verifyInterval = setInterval(() => {
      const newStatus = Math.random() > 0.15; // 85% verified
      setIsVerified(newStatus);
      if (!newStatus) {
        setVerificationWarnings(prev => prev + 1);
      }
    }, 5000);

    return () => clearInterval(verifyInterval);
  }, [task.verification_required]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((task.duration_min * 60 - timeRemaining) / (task.duration_min * 60)) * 100;

  const handleChallengeComplete = () => {
    setShowChallenge(false);
    setXpEarned(prev => prev + 10); // Bonus XP for challenge
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={onEnd} className="p-2 rounded-lg hover:bg-secondary">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-xp-glow" />
          <span className="text-sm font-bold font-mono-time text-xp-glow">
            +{Math.floor(xpEarned)} XP
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isVerified ? "bg-success/20 text-success" : "bg-accent/20 text-accent animate-pulse"
        )}>
          {isVerified ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {isVerified ? "Verified" : "Check position"}
        </div>
      </header>

      {/* Camera preview (simulated) */}
      {task.verification_required && (
        <div className="relative mx-4 mt-4 h-32 rounded-2xl bg-secondary/50 border border-border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          {/* Verification overlay */}
          <div className={cn(
            "absolute inset-0 border-4 rounded-2xl transition-colors duration-300",
            isVerified ? "border-success/50" : "border-accent/50"
          )} />
          {/* Face detection indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Eye className={cn(
              "w-4 h-4",
              isVerified ? "text-success" : "text-accent"
            )} />
            <span className="text-xs font-medium text-foreground">
              Face {isVerified ? "detected" : "not detected"}
            </span>
          </div>
        </div>
      )}

      {/* Task info */}
      <div className="px-4 py-6 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">{task.title}</h2>
        <p className="text-sm text-muted-foreground">
          {task.priority === 'high' && '🔥 '}{task.duration_min} minute session
        </p>
      </div>

      {/* Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-64 h-64">
          {/* Progress ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-secondary"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className={cn(
                "transition-all duration-300",
                isVerified ? "stroke-primary" : "stroke-accent"
              )}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              style={{
                filter: isVerified 
                  ? 'drop-shadow(0 0 10px hsl(var(--primary) / 0.5))' 
                  : 'drop-shadow(0 0 10px hsl(var(--accent) / 0.5))',
              }}
            />
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-5xl font-bold font-mono-time",
              isVerified ? "text-foreground" : "text-accent"
            )}>
              {formatTime(timeRemaining)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              {isPaused ? "PAUSED" : "remaining"}
            </span>
          </div>
        </div>

        {/* Verification warnings */}
        {verificationWarnings > 0 && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
            <span className="text-sm text-accent">
              ⚠️ {verificationWarnings} verification warning{verificationWarnings > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-8 pt-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon-lg"
            onClick={onEnd}
            className="rounded-full"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
          
          <Button
            variant={isPaused ? "glow" : "danger"}
            size="xl"
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-full w-20 h-20"
          >
            {isPaused ? (
              <Play className="w-8 h-8" />
            ) : (
              <Pause className="w-8 h-8" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon-lg"
            onClick={onEnd}
            className="rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Anti-cheat challenge modal */}
      {showChallenge && (
        <div className="fixed inset-0 bg-background/95 z-60 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Verification Check
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tap the button to confirm you're still focused
            </p>
            <Button
              variant="glow"
              size="lg"
              onClick={handleChallengeComplete}
              className="w-full"
            >
              I'm Focused
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
