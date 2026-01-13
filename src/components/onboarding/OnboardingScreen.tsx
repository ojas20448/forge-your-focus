import React, { useState } from 'react';
import { ChevronRight, Target, Check, Loader2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useCameraPermission } from '@/hooks/useCameraPermission';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requestPermission } = useCameraPermission();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const [data, setData] = useState({
    name: '',
    mainGoal: '',
    weeklyHours: 15,
  });

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const weeklyHoursOptions = [
    { value: 10, label: '10 hrs', desc: 'Light' },
    { value: 15, label: '15 hrs', desc: 'Moderate' },
    { value: 20, label: '20 hrs', desc: 'Committed' },
    { value: 25, label: '25 hrs', desc: 'Intense' },
  ];

  const handleCameraRequest = async () => {
    const granted = await requestPermission();
    setCameraGranted(granted);
    if (granted) {
      setTimeout(() => {
        setShowCameraPopup(false);
        handleFinish();
      }, 1000);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      onComplete();
      return;
    }

    setSaving(true);
    try {
      // Update profile
      await supabase.from('profiles').upsert({
        user_id: user.id,
        display_name: data.name,
        weekly_hours_target: data.weeklyHours,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      // Create main goal
      if (data.mainGoal.trim()) {
        await supabase.from('goals').insert({
          user_id: user.id,
          title: data.mainGoal,
          type: 'year',
          target_date: format(new Date(2026, 11, 31), 'yyyy-MM-dd'),
          is_active: true,
          progress: 0
        });
      }

      toast({ title: 'Welcome!', description: "You're all set to start focusing." });
      onComplete();
    } catch (error) {
      console.error('Error saving:', error);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Final step - show camera popup
      setShowCameraPopup(true);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.name.trim().length > 0;
      case 2: return data.mainGoal.trim().length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Welcome to Xecute
              </h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Let's set up your account in just a few steps. This will take less than a minute.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">What's your name?</h2>
              <p className="text-muted-foreground text-sm">This helps us personalize your experience.</p>
            </div>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-4 rounded-xl bg-card border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Main Goal */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">What's your main focus?</h2>
              <p className="text-muted-foreground text-sm">What do you want to achieve this year?</p>
            </div>
            <input
              type="text"
              value={data.mainGoal}
              onChange={(e) => setData({ ...data, mainGoal: e.target.value })}
              placeholder="e.g., Learn to code, Get fit, Study for exams"
              className="w-full px-4 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {['Learn a new skill', 'Get healthier', 'Study for exams', 'Build a project'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setData({ ...data, mainGoal: suggestion })}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Weekly Hours */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">How much time do you have?</h2>
              <p className="text-muted-foreground text-sm">Select your weekly focus time commitment.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {weeklyHoursOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setData({ ...data, weeklyHours: option.value })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    data.weeklyHours === option.value
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <p className={cn(
                    "text-xl font-bold",
                    data.weeklyHours === option.value ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-6 border-t border-border">
        <Button
          className="w-full h-12"
          onClick={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : step === totalSteps - 1 ? (
            'Finish Setup'
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
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

      {/* Camera Permission Popup */}
      {showCameraPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCameraPopup(false);
              handleFinish();
            }}
          />

          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowCameraPopup(false);
                handleFinish();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                cameraGranted ? "bg-success/20" : "bg-primary/10"
              )}>
                {cameraGranted ? (
                  <Check className="w-7 h-7 text-success" />
                ) : (
                  <Camera className="w-7 h-7 text-primary" />
                )}
              </div>

              {cameraGranted ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Camera Enabled!</h3>
                  <p className="text-sm text-muted-foreground">Focus tracking is ready.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Enable Camera?</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    We use your camera to verify focus sessions. All processing happens on your device.
                  </p>

                  <Button
                    onClick={handleCameraRequest}
                    className="w-full mb-2"
                  >
                    Enable Camera
                  </Button>
                  <button
                    onClick={() => {
                      setShowCameraPopup(false);
                      handleFinish();
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
