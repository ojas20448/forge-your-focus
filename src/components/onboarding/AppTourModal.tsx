import React, { useState, useEffect } from 'react';
import { X, Calendar, Target, Zap, Eye, TrendingUp, Shield, ChevronRight, ChevronLeft, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';
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
  targetSelector: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right'; // Where to position the tooltip relative to target
}

const tourSteps: TourStep[] = [
  {
    title: "Today's Timeline",
    description: "Your daily schedule shows up here. Time blocks guide you through the day—just tap a task to view details or start focusing.",
    icon: <Calendar className="w-8 h-8" />,
    color: "text-primary",
    targetSelector: '[data-tour="timeline"]',
    position: 'bottom',
    tips: [
      "Swipe left/right on date strip to view other days",
      "Tasks show start time, duration, and priority",
      "Tap any task to see details"
    ]
  },
  {
    title: "Floating Action Button",
    description: "Tap this button anytime to add new tasks. You can manually create tasks or use the AI scheduler.",
    icon: <Zap className="w-8 h-8" />,
    color: "text-warning",
    targetSelector: '[data-tour="fab"]',
    position: 'top',
    tips: [
      "Access from any screen",
      "Opens the task creation menu",
      "Quick way to stay productive"
    ]
  },
  {
    title: "AI Scheduler",
    description: "Tell the AI what you need to do, and it generates an optimal schedule based on your energy profile and goals.",
    icon: <Zap className="w-8 h-8" />,
    color: "text-warning",
    targetSelector: '[data-tour="ai-planner"]',
    position: 'bottom',
    tips: [
      "Type tasks in natural language",
      "AI schedules during your peak hours",
      "Select which tasks to add to timeline"
    ]
  },
  {
    title: "Goal Tracking",
    description: "Track your year goal and monthly milestones. Every completed task contributes to your progress.",
    icon: <Target className="w-8 h-8" />,
    color: "text-success",
    targetSelector: '[data-tour="goals"]',
    position: 'bottom',
    tips: [
      "Link tasks to goals for alignment tracking",
      "Monitor monthly milestone progress",
      "Earn bonus XP for goal-aligned tasks"
    ]
  },
  {
    title: "Stats & Progress",
    description: "Track your streaks, XP, level, and focus hours. See your productivity trends here.",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "text-purple-500",
    targetSelector: '[data-tour="stats"]',
    position: 'bottom',
    tips: [
      "Monitor daily and weekly streaks",
      "View focus session statistics",
      "Unlock achievements as you progress"
    ]
  },
  {
    title: "Focus Sessions",
    description: "Start a focus session when you begin working on a task. Camera verification ensures you're actually working.",
    icon: <Eye className="w-8 h-8" />,
    color: "text-accent",
    targetSelector: '[data-tour="focus"]',
    position: 'bottom',
    tips: [
      "Camera checks if you're focused",
      "Get challenged if system suspects distraction",
      "Earn XP by completing focus sessions"
    ]
  }
];

export const AppTourModal: React.FC<AppTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight the target element
  useEffect(() => {
    if (!isOpen) return;
    
    const findTarget = () => {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll the element into view smoothly
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    // Delay to allow DOM to render
    const timer = setTimeout(findTarget, 100);
    
    // Re-calculate on resize
    window.addEventListener('resize', findTarget);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findTarget);
    };
  }, [isOpen, currentStep, step.targetSelector]);

  if (!isOpen) return null;

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

  // Calculate tooltip position based on target element
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    
    switch (step.position) {
      case 'top':
        return {
          top: targetRect.top - padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)',
          maxWidth: tooltipWidth,
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
          maxWidth: tooltipWidth,
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - padding,
          transform: 'translate(-100%, -50%)',
          maxWidth: tooltipWidth,
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
          maxWidth: tooltipWidth,
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
          maxWidth: tooltipWidth,
        };
    }
  };

  // Arrow icon based on position
  const ArrowIcon = () => {
    switch (step.position) {
      case 'top': return <ArrowDown className="w-6 h-6 text-primary animate-bounce" />;
      case 'bottom': return <ArrowUp className="w-6 h-6 text-primary animate-bounce" />;
      case 'left': return <ArrowRight className="w-6 h-6 text-primary animate-bounce" />;
      case 'right': return <ArrowLeft className="w-6 h-6 text-primary animate-bounce" />;
      default: return <ArrowUp className="w-6 h-6 text-primary animate-bounce" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0">
        {/* Full dark overlay */}
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />
        
        {/* Spotlight effect on target element */}
        {targetRect && (
          <>
            {/* Glowing spotlight */}
            <div
              className="absolute pointer-events-none transition-all duration-300"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 4px rgba(var(--primary), 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.8)',
                borderRadius: '12px',
                border: '2px solid hsl(var(--primary))',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            
            {/* Arrow pointing to element */}
            <div
              className="absolute transition-all duration-300"
              style={{
                top: step.position === 'bottom' ? targetRect.bottom + 8 : 
                     step.position === 'top' ? targetRect.top - 32 :
                     targetRect.top + targetRect.height / 2 - 12,
                left: step.position === 'right' ? targetRect.right + 8 :
                      step.position === 'left' ? targetRect.left - 32 :
                      targetRect.left + targetRect.width / 2 - 12,
              }}
            >
              <ArrowIcon />
            </div>
          </>
        )}
      </div>
      
      {/* Tooltip Card */}
      <div 
        className="absolute bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-300 z-10"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-primary/20", step.color)}>
              {step.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{step.title}</h2>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-foreground leading-relaxed text-sm">
            {step.description}
          </p>

          {step.tips && step.tips.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Tips</p>
              <div className="space-y-2">
                {step.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-3">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center gap-3 bg-muted/30">
          {!isFirstStep && (
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="flex-1"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button 
            variant="glow"
            onClick={handleNext}
            className={cn("flex-1", isFirstStep && "w-full")}
            size="sm"
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
