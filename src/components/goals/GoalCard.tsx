import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Clock, Target, Calendar } from 'lucide-react';
import { Goal } from '@/types/focusforge';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const getHealthColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' };
    if (score >= 40) return { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' };
    return { bg: 'bg-accent/20', text: 'text-accent', border: 'border-accent/30' };
  };

  const healthColors = getHealthColor(goal.health_score);
  const isYear = goal.type === 'year';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-200",
        "bg-card hover:bg-card/80",
        isYear ? "border-primary/30 hover:border-primary/50" : "border-border/50 hover:border-border"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Progress ring */}
        <div className="relative w-14 h-14 shrink-0">
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
              className={isYear ? "stroke-primary" : "stroke-muted-foreground"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${goal.progress_percent * 0.94} 94`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold font-mono-time">{goal.progress_percent}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
              isYear ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {goal.type}
            </span>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
              healthColors.bg, healthColors.text
            )}>
              {goal.health_score >= 50 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {goal.health_score}%
            </div>
          </div>

          <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
            {goal.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            {goal.required_weekly_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{goal.required_weekly_hours}h/week</span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>

      {/* Milestones preview */}
      {goal.monthly_milestones && goal.monthly_milestones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Next milestone
            </span>
          </div>
          <p className="text-xs text-foreground line-clamp-1">
            {goal.monthly_milestones[0]}
          </p>
        </div>
      )}
    </button>
  );
};
