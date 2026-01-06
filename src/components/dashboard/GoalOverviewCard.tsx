import React from 'react';
import { ChevronRight, TrendingUp, Clock } from 'lucide-react';
import { Goal } from '@/types/focusforge';
import { cn } from '@/lib/utils';

interface GoalOverviewCardProps {
  yearGoal: Goal;
  nextMilestone?: string;
  daysUntilMilestone?: number;
}

export const GoalOverviewCard: React.FC<GoalOverviewCardProps> = ({
  yearGoal,
  nextMilestone,
  daysUntilMilestone,
}) => {
  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-success bg-success/20';
    if (score >= 40) return 'text-warning bg-warning/20';
    return 'text-accent bg-accent/20';
  };

  const progressPercentage = yearGoal.progress_percent;

  return (
    <div className="px-4 py-2">
      <div className="gradient-card rounded-2xl p-4 border border-border/50 overflow-hidden relative">
        {/* Subtle glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  Year Goal
                </span>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  getHealthColor(yearGoal.health_score)
                )}>
                  {yearGoal.health_score}%
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {yearGoal.title}
              </h3>
            </div>
            <button className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Progress Ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-secondary"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercentage * 0.94} 94`}
                  style={{
                    filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold font-mono-time text-foreground">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            <div className="flex-1">
              {nextMilestone && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Next Milestone</span>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {nextMilestone}
                  </p>
                </div>
              )}
              
              {daysUntilMilestone !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground font-mono-time">
                      {daysUntilMilestone}
                    </span>
                    {' '}days remaining
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
