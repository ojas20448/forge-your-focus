import React, { useState } from 'react';
import { Plus, Target, TrendingUp, Clock, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GoalCard } from './GoalCard';
import { useGoals, CreateGoalInput } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface GoalsScreenProps {
  onOpenPlanner?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onOpenPlanner }) => {
  const { goals, yearGoals, monthGoals, loading, createGoal } = useGoals();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGoal, setNewGoal] = useState<CreateGoalInput>({
    title: '',
    description: '',
    type: 'month',
    target_date: '',
    color: '#8B5CF6'
  });

  const totalProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      console.log('Goal title is empty');
      return;
    }
    
    console.log('Creating goal:', newGoal);
    setCreating(true);
    try {
      const result = await createGoal(newGoal);
      console.log('Goal creation result:', result);
      if (result) {
        setShowCreateModal(false);
        setNewGoal({ title: '', description: '', type: 'month', target_date: '', color: '#8B5CF6' });
        
        // If it's a year goal, open the planner
        if (newGoal.type === 'year' && onOpenPlanner) {
          setTimeout(() => {
            onOpenPlanner();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Goal creation error:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="h-7 w-20 bg-secondary/50 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-secondary/50 rounded animate-pulse" />
              <div className="h-9 w-9 bg-secondary/50 rounded animate-pulse" />
            </div>
          </div>
        </header>
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="px-4 py-2 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="h-6 w-2/3 bg-secondary/50 rounded mb-3 animate-pulse" />
              <div className="h-3 w-full bg-secondary/50 rounded mb-3 animate-pulse" />
              <div className="h-2 w-full bg-secondary/50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Goals</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenPlanner}>
              <Sparkles className="w-4 h-4 mr-1" />
              Planner
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
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
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <span className="text-lg font-bold font-mono-time">
              {goals.filter(g => g.is_active).length}
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
              <GoalCard 
                key={goal.id} 
                goal={{
                  id: goal.id,
                  type: goal.type as 'year' | 'month' | 'week',
                  title: goal.title,
                  description: goal.description || '',
                  target_date: goal.target_date || '',
                  progress_percent: goal.progress || 0,
                  is_active: goal.is_active ?? true,
                  health_score: 70,
                }} 
              />
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
              <GoalCard 
                key={goal.id} 
                goal={{
                  id: goal.id,
                  type: goal.type as 'year' | 'month' | 'week',
                  title: goal.title,
                  description: goal.description || '',
                  target_date: goal.target_date || '',
                  progress_percent: goal.progress || 0,
                  is_active: goal.is_active ?? true,
                  health_score: 70,
                }} 
              />
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
          <Button variant="glow" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Goal
          </Button>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-card border-t border-x border-border rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Create Goal</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Goal Type</label>
                <div className="flex gap-2">
                  {(['year', 'month', 'week'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewGoal(prev => ({ ...prev, type }))}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                        newGoal.type === type 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Master React Development"
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does success look like?"
                  className="bg-secondary/50 min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Target Date</label>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-card">
              <Button 
                variant="glow" 
                className="w-full" 
                onClick={handleCreateGoal}
                disabled={!newGoal.title.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Goal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
