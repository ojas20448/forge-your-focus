import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Calendar, Clock, Target, ChevronRight, Check, Loader2, Pencil, Trash2, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useGoals } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { generateMilestonePlan } from '@/utils/geminiScheduler';

interface Milestone {
  month: string;
  title: string;
  requiredHours: number;
  isComplete: boolean;
}

interface WeeklySprint {
  week: number;
  focus: string;
  hours: number;
  tasks: string[];
}

interface GoalPlannerScreenProps {
  onBack: () => void;
  goalTitle?: string;
}

export const GoalPlannerScreen: React.FC<GoalPlannerScreenProps> = ({
  onBack,
  goalTitle
}) => {
  const { yearGoals } = useGoals();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [acceptedMilestones, setAcceptedMilestones] = useState<number[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ title: string, requiredHours: string }>({ title: '', requiredHours: '' });

  // Use the first year goal or provided goal title
  const activeGoal = yearGoals[0];
  const displayTitle = goalTitle || activeGoal?.title || "Your Goal";

  useEffect(() => {
    // Check if goal has existing milestones
    if (activeGoal?.success_criteria && Array.isArray((activeGoal.success_criteria as any)?.milestones)) {
      const existingMilestones = (activeGoal.success_criteria as any).milestones.map((m: string, i: number) => ({
        month: new Date(2026, i, 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
        title: m,
        requiredHours: 40 + (i * 5), // Default hours
        isComplete: false
      }));
      setMilestones(existingMilestones);
      setShowPlan(true);
    }
  }, [activeGoal]);

  // Calculate current week sprint based on first upcoming milestone
  const currentWeekSprint: WeeklySprint = React.useMemo(() => {
    const currentMilestone = milestones.find(m => !m.isComplete);
    if (!currentMilestone) {
      return {
        week: 1,
        focus: displayTitle,
        hours: 0,
        tasks: ['No active milestones']
      };
    }

    const weeklyHours = Math.ceil(currentMilestone.requiredHours / 4); // Distribute over ~4 weeks
    return {
      week: 1,
      focus: currentMilestone.title,
      hours: weeklyHours,
      tasks: [
        `Focus on: ${currentMilestone.title}`,
        `Target: ${weeklyHours} hours this week`,
        `Review progress mid-week`,
        `Complete milestone by end of ${currentMilestone.month}`
      ]
    };
  }, [milestones, displayTitle]);

  const handleAcceptMilestone = (index: number) => {
    setAcceptedMilestones(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const startEditing = (index: number) => {
    setEditingMilestone(index);
    setEditForm({
      title: milestones[index].title,
      requiredHours: milestones[index].requiredHours.toString()
    });
  };

  const saveEdit = () => {
    if (editingMilestone === null) return;

    const updatedMilestones = [...milestones];
    updatedMilestones[editingMilestone] = {
      ...updatedMilestones[editingMilestone],
      title: editForm.title,
      requiredHours: parseInt(editForm.requiredHours) || 0
    };

    setMilestones(updatedMilestones);
    setEditingMilestone(null);
    toast({ title: 'Milestone updated' });
  };

  const deleteMilestone = (index: number) => {
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(updatedMilestones);
    // Also remove from accepted if it was accepted
    setAcceptedMilestones(prev => {
      const newAccepted = prev.filter(i => i !== index).map(i => i > index ? i - 1 : i);
      return newAccepted;
    });
    toast({ title: 'Milestone removed' });
  };

  const handleGeneratePlan = async () => {
    if (!displayTitle) {
      toast({
        title: 'No goal selected',
        description: 'Please create a year goal first.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && activeGoal) {
        // Use AI to generate milestones
        const aiMilestones = await generateMilestonePlan(
          activeGoal.title,
          activeGoal.description || '',
          activeGoal.target_date || new Date(2026, 11, 31).toISOString(),
          20, // Default weekly hours
          apiKey
        );

        const formattedMilestones = aiMilestones.map(m => ({
          ...m,
          isComplete: false
        }));

        setMilestones(formattedMilestones);
        setShowPlan(true);

        toast({
          title: 'AI Plan Generated! 🤖',
          description: `Created ${formattedMilestones.length} smart milestones for your goal.`
        });
      } else {
        // Fallback to basic generation
        const monthsToGoal = activeGoal?.target_date
          ? Math.ceil((new Date(activeGoal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
          : 5;

        const generatedMilestones: Milestone[] = Array.from({ length: Math.min(monthsToGoal, 12) }, (_, i) => {
          const month = new Date();
          month.setMonth(month.getMonth() + i + 1);
          return {
            month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
            title: `Milestone ${i + 1}: Progress toward ${displayTitle}`,
            requiredHours: 40 + (i * 5),
            isComplete: false
          };
        });

        setMilestones(generatedMilestones);
        setShowPlan(true);

        toast({
          title: 'Plan generated!',
          description: `Created ${generatedMilestones.length} milestones. Add Gemini API key for AI-powered planning.`
        });
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate milestone plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalHours = milestones.reduce((sum, m) => sum + m.requiredHours, 0);
  const acceptedHours = milestones
    .filter((_, i) => acceptedMilestones.includes(i))
    .reduce((sum, m) => sum + m.requiredHours, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Goal Planner</h1>
            <p className="text-xs text-muted-foreground">{displayTitle}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI Powered</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 pb-32">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-mono-time">5</p>
            <p className="text-[10px] text-muted-foreground">Months</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Clock className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-mono-time">{totalHours}</p>
            <p className="text-[10px] text-muted-foreground">Total Hours</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Target className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-mono-time">{milestones.length}</p>
            <p className="text-[10px] text-muted-foreground">Milestones</p>
          </div>
        </div>

        {/* Generate Plan Button */}
        {!showPlan && (
          <Button
            className="w-full h-14"
            variant="glow"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI Decomposing Goal...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Plan
              </>
            )}
          </Button>
        )}

        {/* Monthly Milestones */}
        {showPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Monthly Milestones
              </h2>
              <span className="text-xs text-muted-foreground">
                {acceptedMilestones.length}/{milestones.length} accepted
              </span>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200",
                    acceptedMilestones.includes(index)
                      ? "bg-success/10 border-success/30"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  {editingMilestone === index ? (
                    <div className="space-y-3">
                      <div>
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Milestone title"
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editForm.requiredHours}
                            onChange={(e) => setEditForm(prev => ({ ...prev, requiredHours: e.target.value }))}
                            placeholder="Hours"
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">hours required</span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingMilestone(null)}>
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="w-4 h-4 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {milestone.month}
                            </span>
                            {acceptedMilestones.includes(index) && (
                              <Check className="w-4 h-4 text-success" />
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {milestone.title}
                          </h3>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(index)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMilestone(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={acceptedMilestones.includes(index) ? "success" : "outline"}
                            onClick={() => handleAcceptMilestone(index)}
                            className="shrink-0 ml-1"
                          >
                            {acceptedMilestones.includes(index) ? "Accepted" : "Accept"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{milestone.requiredHours} hours required</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>~{Math.ceil(milestone.requiredHours / 4)} hrs/week</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Accept Progress */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">Plan Acceptance</span>
                <span className="text-xs text-muted-foreground font-mono-time">
                  {acceptedHours}/{totalHours} hrs
                </span>
              </div>
              <Progress
                value={(acceptedMilestones.length / milestones.length) * 100}
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* This Week's Sprint */}
        {showPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                This Week's Sprint
              </h2>
              <span className="text-xs text-primary">Week {currentWeekSprint.week}</span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {currentWeekSprint.focus}
                </h3>
                <span className="text-xs font-mono-time text-primary bg-primary/10 px-2 py-1 rounded">
                  {currentWeekSprint.hours}h
                </span>
              </div>

              <div className="space-y-2">
                {currentWeekSprint.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                    </div>
                    <span className="text-sm text-foreground">{task}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4" variant="glow">
                <ChevronRight className="w-4 h-4 mr-2" />
                Start This Week's Sprint
              </Button>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {showPlan && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Sparkles className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">AI Suggestion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on your energy profile (morning lark), I recommend scheduling Physics
                  during 8-11 AM and lighter review tasks in the evening. This optimizes
                  retention by 23%.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {showPlan && acceptedMilestones.length === milestones.length && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border max-w-md mx-auto">
          <Button className="w-full h-12" variant="glow" onClick={onBack}>
            <Check className="w-4 h-4 mr-2" />
            Confirm & Activate Plan
          </Button>
        </div>
      )}
    </div>
  );
};
