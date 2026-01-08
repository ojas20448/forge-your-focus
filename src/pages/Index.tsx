import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Sparkles } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNavigation, TabId } from '@/components/layout/BottomNavigation';
import { DateStrip } from '@/components/dashboard/DateStrip';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { GoalOverviewCard } from '@/components/dashboard/GoalOverviewCard';
import { Timeline } from '@/components/timeline/Timeline';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { CameraStatusBubble } from '@/components/CameraStatusBubble';
import { FocusSessionScreen } from '@/components/focus/FocusSessionScreen';
import { GoalsScreen } from '@/components/goals/GoalsScreen';
import { GoalPlannerScreen } from '@/components/goals/GoalPlannerScreen';
import { ManifestationScreen } from '@/components/manifestation/ManifestationScreen';
import { RaidsScreen } from '@/components/raids/RaidsScreen';
import { StatsScreen } from '@/components/stats/StatsScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { AchievementsScreen } from '@/components/achievements/AchievementsScreen';
import { ContractsOverviewScreen } from '@/components/contracts/ContractsOverviewScreen';
import { AISchedulerModal } from '@/components/scheduler/AISchedulerModal';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { DailyCheckinModal } from '@/components/checkin/DailyCheckinModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { QuickAddTaskModal } from '@/components/tasks/QuickAddTaskModal';
import { AppTourModal } from '@/components/onboarding/AppTourModal';
import { CameraPermissionModal } from '@/components/CameraPermissionModal';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Task, TaskStatus, TaskType } from '@/types/focusforge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTasks, DbTask } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useTaskDecay } from '@/hooks/useTaskDecay';
import { taskDecayService } from '@/utils/taskDecayService';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ONBOARDING_KEY = 'xecute_onboarded';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    }
    return false;
  });

  // Check if user has completed onboarding in database
  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.onboarding_completed) {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setHasOnboarded(true);
      }
    }
  }, [profile, profileLoading]);

  const [showAppTour, setShowAppTour] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const { toast } = useToast();

  // Fetch tasks and goals from database
  const { tasks: dbTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(selectedDate);
  const { goals, yearGoals, loading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { hasCheckedInToday, loading: checkinLoading } = useDailyCheckin();
  const { checkAndApplyDecay } = useTaskDecay();

  // Start automatic task decay service
  useEffect(() => {
    if (user && hasOnboarded) {
      taskDecayService.start({
        decayCheckInterval: 6 * 60 * 60 * 1000, // 6 hours
      });
      console.log('Task decay automation started');
      
      return () => {
        taskDecayService.stop();
      };
    }
  }, [user, hasOnboarded]);

  // Check for decayed tasks on mount
  useEffect(() => {
    if (user && !tasksLoading) {
      checkAndApplyDecay();
    }
  }, [user, tasksLoading, checkAndApplyDecay]);

  // Show daily check-in modal if not checked in today
  useEffect(() => {
    if (!checkinLoading && !hasCheckedInToday && hasOnboarded && user) {
      // Small delay to let the app load first
      const timer = setTimeout(() => {
        setShowCheckinModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [checkinLoading, hasCheckedInToday, hasOnboarded, user]);

  // Convert DB tasks to UI Task format
  const tasks: Task[] = dbTasks.map(dbTask => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    type: 'deepwork' as TaskType,
    status: (dbTask.is_completed ? 'completed' : 'pending') as TaskStatus,
    duration_min: dbTask.duration_minutes,
    priority: (dbTask.priority || 'medium') as 'low' | 'medium' | 'high',
    decay_level: dbTask.decay_level || 0,
    suggested_block: {
      start: dbTask.start_time.slice(0, 5),
      end: dbTask.end_time.slice(0, 5),
    },
    verification_required: false,
    linked_goal_id: dbTask.goal_id || undefined,
    goal_alignment_score: dbTask.goal_id ? 0.8 : 0,
    xp_earned: dbTask.xp_reward || 0,
  }));

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const hour = new Date().getHours();
  const timeOfDay = hour < 10 ? 'morning' : hour < 18 ? 'midday' : 'evening';
  const hasActiveTask = tasks.some(t => t.status === 'active');

  // Build user stats from profile
  const userStats = {
    total_xp: profile?.total_xp || 0,
    level: profile?.level || 1,
    current_streak: profile?.current_streak || 0,
    longest_streak: profile?.longest_streak || 0,
    league: 'bronze' as const,
    league_rank: 1,
    efficiency_multiplier: 1,
    manifestation_streak: 0,
    weekly_focus_hours: 0,
    weekly_goal_hours: profile?.weekly_hours_target || 20,
    energy_profile: (profile?.energy_profile as 'morning_lark' | 'night_owl' | 'balanced') || 'balanced',
    debt_score: 0,
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasOnboarded(true);
    
    // Refetch goals to show newly created goal from onboarding
    setTimeout(() => {
      refetchGoals();
    }, 200);
    
    setShowAppTour(true);
    
    // Request camera permission after onboarding
    setTimeout(() => {
      setShowCameraPermission(true);
    }, 2000); // Show 2 seconds after tour starts
    
    toast({ 
      title: "Welcome to Xecute!", 
      description: "Your goal has been created! Let's explore the app." 
    });
  };

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleTaskClick = (task: Task) => {
    // Open task detail modal instead of immediately starting focus
    setSelectedTask(task);
  };

  const handleStartFocusFromDetail = () => {
    if (selectedTask && (selectedTask.status === 'pending' || selectedTask.status === 'active')) {
      setActiveFocusTask(selectedTask);
      setSelectedTask(null);
    }
  };

  const handleFABAction = (action: string) => {
    if (action === 'plan') {
      setShowSchedulerModal(true);
      return;
    }

    if (action === 'quick-task') {
      setShowQuickAddTask(true);
      return;
    }

    if (action === 'focus' || action === 'focus-now') {
      const pendingTask = tasks.find(t => t.status === 'pending' || t.status === 'active');
      if (pendingTask) {
        setActiveFocusTask(pendingTask);
      } else {
        // No tasks - show quick add instead of scheduler
        setShowQuickAddTask(true);
        toast({
          title: "No tasks yet",
          description: "Add your first task to get started."
        });
      }
      return;
    }

    toast({ title: "Daily Review", description: "Feature coming soon..." });
  };

  const handleTasksGenerated = () => {
    refetchTasks();
    toast({ title: "Tasks Added", description: "New tasks have been added to your schedule!" });
  };

  // Onboarding Screen
  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Focus Session Screen (full screen takeover)
  if (activeFocusTask) {
    return (
      <FocusSessionScreen
        task={activeFocusTask}
        onEnd={(xpEarned) => {
          setActiveFocusTask(null);
          refetchTasks();
          toast({ title: "Session ended", description: `+${xpEarned} XP earned!` });
        }}
        onPause={() => {}}
      />
    );
  }

  // Goal Planner Screen (full screen)
  if (showGoalPlanner) {
    return <GoalPlannerScreen onBack={() => setShowGoalPlanner(false)} />;
  }

  // Main Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return (
          <ErrorBoundary>
            <GoalsScreen onOpenPlanner={() => setShowGoalPlanner(true)} />
          </ErrorBoundary>
        );
      case 'raids':
        return (
          <ErrorBoundary>
            <RaidsScreen />
          </ErrorBoundary>
        );
      case 'contracts':
        return (
          <ErrorBoundary>
            <ContractsOverviewScreen onBack={() => setActiveTab('home')} />
          </ErrorBoundary>
        );
      case 'stats':
        return (
          <ErrorBoundary>
            <AchievementsScreen />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <SettingsScreen />
          </ErrorBoundary>
        );
      default:
        return (
          <>
            <CameraStatusBubble isActive={hasActiveTask} isValid={true} />
            <header className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Xecute
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs font-bold text-primary font-mono-time">LVL {userStats.level}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                    aria-label="Profile"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </header>
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} dayStatuses={{}} />
            <div data-tour="stats">
              <StatsBar stats={userStats} />
            </div>
            
            {/* AI Coaching Message */}
            {userStats.current_streak > 0 && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI Coach</span>
                </div>
                <p className="text-sm text-foreground">
                  {userStats.current_streak >= 7 
                    ? `Amazing! ${userStats.current_streak} day streak! You're building unstoppable momentum! 🔥`
                    : userStats.current_streak >= 3
                    ? `${userStats.current_streak} days strong! Keep the momentum going! 💪`
                    : `Day ${userStats.current_streak}! Every day counts. Stay consistent! ⚡`
                  }
                </p>
              </div>
            )}
            
            {yearGoals.length > 0 && (
              <div data-tour="goals">
                <GoalOverviewCard 
                  yearGoal={{
                    id: yearGoals[0].id,
                    type: 'year',
                    title: yearGoals[0].title,
                    description: yearGoals[0].description || '',
                    target_date: yearGoals[0].target_date || format(new Date(2026, 11, 31), 'yyyy-MM-dd'),
                    progress_percent: yearGoals[0].progress || 0,
                    is_active: yearGoals[0].is_active ?? true,
                    health_score: 70,
                  }} 
                  nextMilestone={(yearGoals[0].success_criteria as { milestones?: string[] } | null)?.milestones?.[0] || "Keep building momentum"} 
                  daysUntilMilestone={30} 
                />
              </div>
            )}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between" data-tour="timeline">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Today's Timeline</h2>
              <span className="text-xs text-muted-foreground font-mono-time">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed
              </span>
            </div>
            {tasksLoading ? (
              <div className="space-y-3 px-4 py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="ml-14 mr-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-secondary/50 rounded mb-2 animate-pulse" />
                        <div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
                      </div>
                      <div className="w-16 h-6 bg-secondary/50 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-4 bg-secondary/50 rounded animate-pulse" />
                      <div className="w-16 h-4 bg-secondary/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Timeline tasks={tasks} onTaskClick={handleTaskClick} />
            )}
            <div data-tour="fab">
              <FloatingActionButton timeOfDay={timeOfDay} onAction={handleFABAction} />
            </div>
          </>
        );
    }
  };

  return (
    <MobileLayout showNav={false}>
      {renderTabContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <AISchedulerModal 
        isOpen={showSchedulerModal} 
        onClose={() => setShowSchedulerModal(false)}
        onTasksGenerated={handleTasksGenerated}
        energyProfile={userStats.energy_profile}
        goals={goals.map(g => ({ title: g.title, id: g.id }))}
        selectedDate={selectedDate}
      />
      <DailyCheckinModal 
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
      />
      <QuickAddTaskModal 
        isOpen={showQuickAddTask}
        onClose={() => {
          setShowQuickAddTask(false);
          refetchTasks();
        }}
        selectedDate={selectedDate}
      />
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            refetchTasks();
          }}
          onStartFocus={handleStartFocusFromDetail}
        />
      )}
      <AppTourModal 
        isOpen={showAppTour}
        onClose={() => setShowAppTour(false)}
      />
      {showCameraPermission && (
        <CameraPermissionModal onClose={() => setShowCameraPermission(false)} />
      )}
    </MobileLayout>
  );
};

export default Index;
