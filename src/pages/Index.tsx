import React, { useState } from 'react';
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
import { AISchedulerModal } from '@/components/scheduler/AISchedulerModal';
import { mockTasks, mockYearGoal, mockUserStats, mockDayStatuses } from '@/data/mockData';
import { Task } from '@/types/focusforge';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const { toast } = useToast();

  const hour = new Date().getHours();
  const timeOfDay = hour < 10 ? 'morning' : hour < 18 ? 'midday' : 'evening';
  const hasActiveTask = mockTasks.some(t => t.status === 'active');

  const handleTaskClick = (task: Task) => {
    if (task.status === 'pending' || task.status === 'active') {
      setActiveFocusTask(task);
    }
  };

  const handleFABAction = (action: string) => {
    if (action === 'focus' || action === 'focus-now') {
      const pendingTask = mockTasks.find(t => t.status === 'pending' || t.status === 'active');
      if (pendingTask) setActiveFocusTask(pendingTask);
    } else if (action === 'plan') {
      setShowSchedulerModal(true);
    } else {
      toast({ title: "Daily Review", description: "Feature coming soon..." });
    }
  };

  const handleTasksGenerated = () => {
    toast({ title: "Tasks Added", description: "New tasks have been added to your schedule!" });
  };

  // Focus Session Screen (full screen takeover)
  if (activeFocusTask) {
    return (
      <FocusSessionScreen
        task={activeFocusTask}
        onEnd={() => {
          setActiveFocusTask(null);
          toast({ title: "Session ended", description: `+${Math.floor(Math.random() * 100 + 50)} XP earned!` });
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
        return <GoalsScreen onOpenPlanner={() => setShowGoalPlanner(true)} />;
      case 'raids':
        return <RaidsScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <>
            <CameraStatusBubble isActive={hasActiveTask} isValid={true} />
            <header className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Focus<span className="text-primary">Forge</span>
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-xs font-bold text-primary font-mono-time">LVL {mockUserStats.level}</span>
                </div>
              </div>
            </header>
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} dayStatuses={mockDayStatuses} />
            <StatsBar stats={mockUserStats} />
            <GoalOverviewCard yearGoal={mockYearGoal} nextMilestone="Complete Physics Mechanics" daysUntilMilestone={24} />
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Today's Timeline</h2>
              <span className="text-xs text-muted-foreground font-mono-time">
                {mockTasks.filter(t => t.status === 'completed').length}/{mockTasks.length} completed
              </span>
            </div>
            <Timeline tasks={mockTasks} onTaskClick={handleTaskClick} />
            <FloatingActionButton timeOfDay={timeOfDay} onAction={handleFABAction} />
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
      />
    </MobileLayout>
  );
};

export default Index;
