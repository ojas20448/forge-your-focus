import React, { useState } from 'react';
import { X, Calendar, Target, Zap, Eye, TrendingUp, Shield, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    title: "Today's Timeline",
    description: "Your daily schedule shows up here. Time blocks guide you through the day—just tap a task to view details or start focusing.",
    icon: <Calendar className="w-8 h-8" />,
    color: "text-primary",
    tips: [
      "Tap the floating button to add tasks",
      "Swipe left/right on date strip to view other days",
      "Tasks show start time, duration, and priority"
    ]
  },
  {
    title: "AI Scheduler",
    description: "Tell the AI what you need to do, and it generates an optimal schedule based on your energy profile and goals.",
    icon: <Zap className="w-8 h-8" />,
    color: "text-warning",
    tips: [
      "Type tasks in natural language",
      "AI schedules during your peak hours",
      "Select which tasks to add to timeline"
    ]
  },
  {
    title: "Goal Tracking",
    description: "Set your year goal and monthly milestones. Every task you complete contributes to your progress.",
    icon: <Target className="w-8 h-8" />,
    color: "text-success",
    tips: [
      "Link tasks to goals for alignment tracking",
      "Monitor monthly milestone progress",
      "Earn bonus XP for goal-aligned tasks"
    ]
  },
  {
    title: "Focus Sessions",
    description: "Start a focus session with camera verification. Anti-cheat ensures you're actually working—no distractions allowed.",
    icon: <Eye className="w-8 h-8" />,
    color: "text-accent",
    tips: [
      "Camera checks if you're focused",
      "Get challenged if system suspects distraction",
      "Earn XP and maintain streaks by completing tasks"
    ]
  },
  {
    title: "Commitment Contracts",
    description: "Stake XP on tasks you must complete. Fail to finish, and you lose the XP—accountability through consequences.",
    icon: <Shield className="w-8 h-8" />,
    color: "text-blue-500",
    tips: [
      "Stake XP on critical tasks",
      "Lose staked XP if you don't complete",
      "Perfect for high-priority commitments"
    ]
  },
  {
    title: "Stats & Progress",
    description: "Track your streaks, XP, level, and focus hours. See your productivity trends and celebrate achievements.",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "text-purple-500",
    tips: [
      "Monitor daily and weekly streaks",
      "View focus session statistics",
      "Unlock achievements as you progress"
    ]
  }
];

export const AppTourModal: React.FC<AppTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border-t border-x border-border rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-primary/10", step.color)}>
              {step.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{step.title}</h2>
              <p className="text-xs text-muted-foreground">
                {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            <p className="text-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {step.tips && step.tips.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Quick Tips:</p>
              <div className="space-y-2">
                {step.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center gap-3">
          {!isFirstStep && (
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button 
            variant="glow"
            onClick={handleNext}
            className={cn("flex-1", isFirstStep && "w-full")}
          >
            {isLastStep ? (
              <>
                Get Started
                <Zap className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
