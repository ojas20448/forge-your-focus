import React, { useState, useEffect } from 'react';
import { ChevronLeft, Volume2, Check, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAffirmations, Affirmation } from '@/hooks/useAffirmations';

interface AffirmationSessionProps {
  onComplete: () => void;
  onBack: () => void;
}

export const AffirmationSession: React.FC<AffirmationSessionProps> = ({
  onComplete,
  onBack
}) => {
  const { getActiveAffirmations, recordSession } = useAffirmations();
  const affirmations = getActiveAffirmations();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showCompletion, setShowCompletion] = useState(false);

  const currentAffirmation = affirmations[currentIndex];
  const progress = (completedIds.size / affirmations.length) * 100;
  const isCurrentCompleted = currentAffirmation && completedIds.has(currentAffirmation.id);

  const handleSpeak = () => {
    if (!currentAffirmation || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentAffirmation.text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleMarkComplete = () => {
    if (!currentAffirmation) return;
    
    setCompletedIds(prev => new Set([...prev, currentAffirmation.id]));
    
    // Auto advance after marking complete
    if (currentIndex < affirmations.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 500);
    }
  };

  const handleNext = () => {
    if (currentIndex < affirmations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishSession = async () => {
    const durationMinutes = Math.ceil((Date.now() - sessionStartTime) / 60000);
    await recordSession('affirmation', Math.max(1, durationMinutes));
    setShowCompletion(true);
  };

  const allCompleted = completedIds.size === affirmations.length;

  // Auto-speak on affirmation change
  useEffect(() => {
    // Small delay before auto-speaking
    const timer = setTimeout(() => {
      if (currentAffirmation && !isCurrentCompleted) {
        handleSpeak();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (affirmations.length === 0) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
        <Flame className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Affirmations</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Add some affirmations first to start a session
        </p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
        <p className="text-sm text-muted-foreground text-center mb-2">
          You practiced {completedIds.size} affirmation{completedIds.size !== 1 ? 's' : ''}
        </p>
        <p className="text-lg font-bold text-primary mb-8">+25 XP</p>
        <Button variant="glow" size="lg" onClick={onComplete}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="font-semibold text-foreground">Affirmation Session</h2>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} of {affirmations.length}
          </span>
        </div>
        <div className="w-8" />
      </header>

      {/* Progress */}
      <div className="px-4 py-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {completedIds.size} completed
          </span>
          <span className="text-xs text-muted-foreground">
            {affirmations.length - completedIds.size} remaining
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Status icon */}
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-300",
          isCurrentCompleted 
            ? "bg-success/20" 
            : isSpeaking 
              ? "bg-primary/20 animate-pulse" 
              : "bg-manifestation/20"
        )}>
          {isCurrentCompleted ? (
            <Check className="w-12 h-12 text-success" />
          ) : (
            <Flame className={cn(
              "w-12 h-12 transition-colors",
              isSpeaking ? "text-primary" : "text-manifestation"
            )} />
          )}
        </div>

        {/* Affirmation text */}
        <p className="text-xl font-semibold text-foreground mb-8 max-w-sm leading-relaxed">
          "{currentAffirmation?.text}"
        </p>

        {/* Category badge */}
        {currentAffirmation?.category && (
          <span className="px-3 py-1 rounded-full text-xs bg-secondary text-muted-foreground mb-6">
            {currentAffirmation.category}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSpeak}
            className={cn(
              "w-12 h-12 rounded-full",
              isSpeaking && "bg-primary/20 border-primary"
            )}
          >
            <Volume2 className={cn(
              "w-5 h-5",
              isSpeaking && "text-primary animate-pulse"
            )} />
          </Button>

          {!isCurrentCompleted && (
            <Button
              variant="success"
              size="lg"
              onClick={handleMarkComplete}
              className="px-6"
            >
              <Check className="w-4 h-4 mr-2" />
              I believe this
            </Button>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="p-4 border-t border-border">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {allCompleted ? (
            <Button variant="glow" onClick={handleFinishSession}>
              <Sparkles className="w-4 h-4 mr-2" />
              Finish Session
            </Button>
          ) : currentIndex === affirmations.length - 1 ? (
            <Button 
              variant="outline"
              onClick={handleFinishSession}
              disabled={completedIds.size === 0}
            >
              End Early
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
