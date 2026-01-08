import React, { useState } from 'react';
import { ChevronRight, Target, Brain, Eye, Flame, Zap, Sun, Moon, Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { createGeminiScheduler } from '@/utils/geminiScheduler';
import { useTasks } from '@/hooks/useTasks';

interface OnboardingScreenProps {
  onComplete: () => void;
}

type EnergyProfile = 'morning_lark' | 'night_owl' | 'balanced';

interface OnboardingData {
  name: string;
  yearGoal: string;
  goalWeeklyHours: number; // Hours per week for this specific goal
  goalPreferredTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
  energyProfile: EnergyProfile;
  weeklyHours: number;
  manifestationEnabled: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createBulkTasks } = useTasks();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    yearGoal: '',
    goalWeeklyHours: 10,
    goalPreferredTime: 'flexible',
    energyProfile: 'balanced',
    weeklyHours: 20,
    manifestationEnabled: true
  });

  const totalSteps = 7; // Increased from 5 to 7
  const progress = ((step + 1) / totalSteps) * 100;

  const energyProfiles = [
    { id: 'morning_lark' as EnergyProfile, icon: Sun, label: 'Morning Lark', desc: 'Peak focus 6AM-12PM' },
    { id: 'balanced' as EnergyProfile, icon: Coffee, label: 'Balanced', desc: 'Steady throughout day' },
    { id: 'night_owl' as EnergyProfile, icon: Moon, label: 'Night Owl', desc: 'Peak focus 6PM-12AM' },
  ];

  const weeklyHoursOptions = [10, 15, 20, 25, 30, 40];
  
  const goalHoursOptions = [5, 10, 15, 20, 25, 30];
  
  const timePreferences = [
    { id: 'morning' as const, label: '🌅 Morning', time: '6am-12pm', desc: 'Fresh start' },
    { id: 'afternoon' as const, label: '☀️ Afternoon', time: '12pm-5pm', desc: 'Productive hours' },
    { id: 'evening' as const, label: '🌆 Evening', time: '5pm-9pm', desc: 'After-work focus' },
    { id: 'night' as const, label: '🌙 Night', time: '9pm-1am', desc: 'Quiet hours' },
    { id: 'flexible' as const, label: '🔄 Flexible', time: 'Anytime', desc: 'No preference' },
  ];

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    // Final step - save to database
    if (!user) {
      console.error('No user found during onboarding');
      onComplete();
      return;
    }

    setSaving(true);
    try {
      // 1. Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: data.name,
          energy_profile: data.energyProfile,
          weekly_hours_target: data.weeklyHours,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // 2. Create year goal with time allocation
      const targetDate = format(new Date(2026, 11, 31), 'yyyy-MM-dd'); // Dec 31, 2026
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: data.yearGoal,
          description: `📅 ${data.goalWeeklyHours} hrs/week | ⏰ Preferred: ${data.goalPreferredTime}\n\nGoal set on ${format(new Date(), 'MMM dd, yyyy')}`,
          type: 'year',
          target_date: targetDate,
          is_active: true,
          progress: 0
        })
        .select()
        .single();

      if (goalError) {
        console.error('Goal creation error:', goalError);
        throw goalError;
      }

      console.log('Goal created successfully:', goalData);

      // 3. Generate initial AI schedule for the goal
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const useRealAI = apiKey && apiKey !== 'YOUR_API_KEY_HERE';

        if (useRealAI) {
          const scheduler = createGeminiScheduler(apiKey);
          const prompt = `Create a first-day starter plan for: ${data.yearGoal}. Generate 2-3 specific, actionable tasks to get started today. Each task should be 45-90 minutes.`;
          
          const aiTasks = await scheduler.generateSchedule({
            userInput: prompt,
            energyProfile: data.energyProfile,
            existingTasks: [],
            goals: [{ title: data.yearGoal }],
            currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          });

          // Create tasks in database
          const tasksToCreate = aiTasks.slice(0, 3).map((task, index) => {
            const startTime = task.suggestedTime.split(' - ')[0];
            const [hours, minutes] = startTime.split(':').map(Number);
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);

            return {
              title: task.title,
              description: task.description || '',
              duration_minutes: task.duration,
              priority: task.priority,
              scheduled_date: format(new Date(), 'yyyy-MM-dd'),
              scheduled_time: startTime,
              task_type: task.taskType || 'deepwork',
              linked_goal_id: goalData.id,
              status: 'pending' as const
            };
          });

          if (tasksToCreate.length > 0) {
            await createBulkTasks(tasksToCreate);
            console.log('Initial tasks created:', tasksToCreate.length);
          }
        }
      } catch (aiError) {
        console.error('Error generating AI schedule:', aiError);
        // Don't fail onboarding if AI scheduling fails
      }

      toast({
        title: 'Welcome aboard! 🎉',
        description: 'Your profile, goal, and starter tasks are ready!'
      });

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Setup incomplete',
        description: 'Some data could not be saved. Please check your goal in the Goals tab.',
        variant: 'destructive'
      });
      // Still complete onboarding even if save fails
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.name.trim().length > 0;
      case 3: return data.goalWeeklyHours > 0;
      case 4: return data.goalPreferredTime !== null;
      case 2: return data.yearGoal.trim().length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6">
        <Progress value={progress} className="h-1" />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {step + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Flame className="w-12 h-12 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to <span className="text-primary">Xecute</span>
              </h1>
              <p className="text-muted-foreground">
                Your hardcore productivity companion. Execute your goals with precision.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-card border border-border">
                <Brain className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">AI Scheduling</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <Eye className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">CV Verification</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <Target className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Goal Tracking</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">What's your name?</h2>
              <p className="text-muted-foreground text-sm">We'll use this to personalize your experience.</p>
            </div>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-4 py-4 rounded-xl bg-card border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Year Goal */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What's your main goal for 2026?
              </h2>
              <p className="text-muted-foreground text-sm">
                This will be your North Star. All daily tasks will align to this.
              </p>
            </div>
            <textarea
              value={data.yearGoal}
              onChange={(e) => setData({ ...data, yearGoal: e.target.value })}
              placeholder="e.g., Crack JEE 2026 with Top 500 rank"
              rows={3}
              className="w-full px-4 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {['Crack JEE 2026', 'Get into IIT', 'Build a startup', 'Learn to code'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setData({ ...data, yearGoal: suggestion })}
                  className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goal Weekly Hours */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Time allocation for this goal
              </h2>
              <p className="text-muted-foreground text-sm">
                How many hours per week will you dedicate to: <span className="font-semibold text-foreground">{data.yearGoal}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {goalHoursOptions.map((hours) => (
                <button
                  key={hours}
                  onClick={() => setData({ ...data, goalWeeklyHours: hours })}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    data.goalWeeklyHours === hours
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-muted-foreground/30"
                  )}
                >
                  <p className={cn(
                    "text-2xl font-bold font-mono-time",
                    data.goalWeeklyHours === hours ? "text-primary" : "text-foreground"
                  )}>
                    {hours}
                  </p>
                  <p className="text-xs text-muted-foreground">hrs/week</p>
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-card/50 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 Tip: This is just for <span className="font-semibold text-foreground">"{data.yearGoal}"</span>. You'll set your total weekly commitment next.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Goal Preferred Time */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                When to work on this goal?
              </h2>
              <p className="text-muted-foreground text-sm">
                AI will prioritize scheduling tasks for this goal during your preferred time.
              </p>
            </div>
            <div className="space-y-3">
              {timePreferences.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => setData({ ...data, goalPreferredTime: pref.id })}
                  className={cn(
                    "w-full p-4 rounded-xl border flex items-center justify-between transition-all",
                    data.goalPreferredTime === pref.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.time} • {pref.desc}</p>
                  </div>
                  {data.goalPreferredTime === pref.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Review Goal */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Review your goal setup
              </h2>
              <p className="text-muted-foreground text-sm">
                Make sure everything looks good before we continue.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">2026 Main Goal</h3>
                  <p className="text-foreground">{data.yearGoal}</p>
                </div>
              </div>
              <div className="space-y-3 mt-4 pt-4 border-t border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time commitment</span>
                  <span className="text-sm font-semibold text-foreground">{data.goalWeeklyHours} hours/week</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preferred time</span>
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {timePreferences.find(p => p.id === data.goalPreferredTime)?.label.split(' ')[1] || 'Flexible'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Target date</span>
                  <span className="text-sm font-semibold text-foreground">Dec 31, 2026</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full p-3 rounded-xl bg-secondary/50 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              ← Edit goal details
            </button>
          </div>
        )}

        {/* Step 6: Energy Profile */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                When do you focus best?
              </h2>
              <p className="text-muted-foreground text-sm">
                AI will schedule your hardest tasks during peak hours.
              </p>
            </div>
            <div className="space-y-3">
              {energyProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setData({ ...data, energyProfile: profile.id })}
                  className={cn(
                    "w-full p-4 rounded-xl border flex items-center gap-4 transition-all",
                    data.energyProfile === profile.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    data.energyProfile === profile.id ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <profile.icon className={cn(
                      "w-6 h-6",
                      data.energyProfile === profile.id ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{profile.label}</p>
                    <p className="text-xs text-muted-foreground">{profile.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Total Weekly Hours */}
        {step === 7 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Total weekly focus commitment
              </h2>
              <p className="text-muted-foreground text-sm">
                How many hours per week can you dedicate to ALL deep work? (Including your {data.goalWeeklyHours}h for "{data.yearGoal}")
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {weeklyHoursOptions.map((hours) => (
                <button
                  key={hours}
                  onClick={() => setData({ ...data, weeklyHours: hours })}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    data.weeklyHours === hours
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-muted-foreground/30"
                  )}
                >
                  <p className={cn(
                    "text-2xl font-bold font-mono-time",
                    data.weeklyHours === hours ? "text-primary" : "text-foreground"
                  )}>
                    {hours}
                  </p>
                  <p className="text-xs text-muted-foreground">hrs/week</p>
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Manifestation</p>
                    <p className="text-xs text-muted-foreground">Daily affirmations & visualization</p>
                  </div>
                </div>
                <button
                  onClick={() => setData({ ...data, manifestationEnabled: !data.manifestationEnabled })}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    data.manifestationEnabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                    data.manifestationEnabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-6 border-t border-border">
        <Button 
          className="w-full h-14" 
          variant="glow"
          onClick={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : step === totalSteps - 1 ? (
            <>
              <Flame className="w-5 h-5 mr-2" />
              Start Xecuting
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
};
