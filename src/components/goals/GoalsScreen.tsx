import React from 'react';
import { Plus, Target, TrendingUp, Clock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from './GoalCard';
import { Goal } from '@/types/focusforge';
import { cn } from '@/lib/utils';

interface GoalsScreenProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onBack?: () => void;
  onCreateGoal?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  onGoalClick,
  onBack,
  onCreateGoal,
}) => {
  const yearGoals = goals.filter(g => g.type === 'year');
  const monthGoals = goals.filter(g => g.type === 'month');

  const totalProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress_percent, 0) / goals.length)
    : 0;

  const averageHealth = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.health_score, 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center justify-between px-4 py-4">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-foreground">Goals</h1>
          <Button variant="ghost" size="icon-sm" onClick={onCreateGoal}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Stats overview */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Goals</span>
            </div>
            <span className="text-lg font-bold font-mono-time">{goals.length}</span>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Progress</span>
            </div>
            <span className="text-lg font-bold font-mono-time">{totalProgress}%</span>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Health</span>
            </div>
            <span className={cn(
              "text-lg font-bold font-mono-time",
              averageHealth >= 70 ? "text-success" : averageHealth >= 40 ? "text-warning" : "text-accent"
            )}>
              {averageHealth}%
            </span>
          </div>
        </div>
      </div>

      {/* Year Goals */}
      {yearGoals.length > 0 && (
        <section className="px-4 py-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Year Goals
          </h2>
          <div className="space-y-3">
            {yearGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onClick={() => onGoalClick?.(goal)} />
            ))}
          </div>
        </section>
      )}

      {/* Month Goals */}
      {monthGoals.length > 0 && (
        <section className="px-4 py-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Monthly Milestones
          </h2>
          <div className="space-y-3">
            {monthGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onClick={() => onGoalClick?.(goal)} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No goals set</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Set your first goal to align your daily work with long-term purpose
          </p>
          <Button variant="glow" onClick={onCreateGoal}>
            <Plus className="w-4 h-4" />
            Create Year Goal
          </Button>
        </div>
      )}
    </div>
  );
};
