import React, { useState } from 'react';
import { ChevronRight, Target, Brain, Eye, Flame, Zap, Sun, Moon, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingScreenProps {
  onComplete: () => void;
}

type EnergyProfile = 'morning_lark' | 'night_owl' | 'balanced';

interface OnboardingData {
  name: string;
  yearGoal: string;
  energyProfile: EnergyProfile;
  weeklyHours: number;
  manifestationEnabled: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    yearGoal: '',
    energyProfile: 'balanced',
    weeklyHours: 20,
    manifestationEnabled: true
  });

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const energyProfiles = [
    { id: 'morning_lark' as EnergyProfile, icon: Sun, label: 'Morning Lark', desc: 'Peak focus 6AM-12PM' },
    { id: 'balanced' as EnergyProfile, icon: Coffee, label: 'Balanced', desc: 'Steady throughout day' },
    { id: 'night_owl' as EnergyProfile, icon: Moon, label: 'Night Owl', desc: 'Peak focus 6PM-12AM' },
  ];

  const weeklyHoursOptions = [10, 15, 20, 25, 30, 40];

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.name.trim().length > 0;
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
                Welcome to <span className="text-primary">FocusForge</span>
              </h1>
              <p className="text-muted-foreground">
                Your hardcore productivity companion. Let's forge your path to success.
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

        {/* Step 3: Energy Profile */}
        {step === 3 && (
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

        {/* Step 4: Weekly Hours */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Weekly focus commitment
              </h2>
              <p className="text-muted-foreground text-sm">
                How many hours per week can you dedicate to deep work?
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
          disabled={!canProceed()}
        >
          {step === totalSteps - 1 ? (
            <>
              <Flame className="w-5 h-5 mr-2" />
              Start Forging
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
