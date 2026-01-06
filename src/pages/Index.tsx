import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DateStrip } from '@/components/dashboard/DateStrip';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { GoalOverviewCard } from '@/components/dashboard/GoalOverviewCard';
import { Timeline } from '@/components/timeline/Timeline';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { CameraStatusBubble } from '@/components/CameraStatusBubble';
import { mockTasks, mockYearGoal, mockUserStats, mockDayStatuses } from '@/data/mockData';
import { Task } from '@/types/focusforge';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFocusActive, setIsFocusActive] = useState(false);
  const { toast } = useToast();

  // Determine time of day for FAB context
  const hour = new Date().getHours();
  const timeOfDay = hour < 10 ? 'morning' : hour < 18 ? 'midday' : 'evening';

  // Check if there's an active task (for camera bubble)
  const hasActiveTask = mockTasks.some(t => t.status === 'active');

  const handleTaskClick = (task: Task) => {
    if (task.status === 'pending') {
      toast({
        title: "Starting Focus Session",
        description: `Beginning ${task.title}`,
      });
    } else if (task.status === 'active') {
      toast({
        title: "Focus Session Active",
        description: `${task.duration_min - 30} minutes remaining`,
      });
    }
  };

  const handleFABAction = (action: string) => {
    switch (action) {
      case 'plan':
        toast({
          title: "AI Scheduler",
          description: "Planning your optimal day...",
        });
        break;
      case 'focus':
      case 'focus-now':
        setIsFocusActive(true);
        toast({
          title: "Focus Mode Activated",
          description: "Camera verification starting...",
        });
        break;
      case 'review':
        toast({
          title: "Daily Review",
          description: "Reviewing your progress...",
        });
        break;
      case 'quick-task':
        toast({
          title: "Quick Task",
          description: "Add a quick task to your schedule",
        });
        break;
    }
  };

  return (
    <>
      {/* SEO Meta */}
      <title>FocusForge — Hardcore Productivity</title>
      <meta name="description" content="AI-powered scheduling with CV verification, heavy gamification, and goal manifestation for deep work professionals." />

      <MobileLayout>
        {/* Camera status for focus mode */}
        <CameraStatusBubble 
          isActive={isFocusActive || hasActiveTask}
          isValid={true}
        />

        {/* Header */}
        <header className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Focus<span className="text-primary">Forge</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-xs font-bold text-primary font-mono-time">
                  LVL {mockUserStats.level}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Date strip */}
        <DateStrip 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          dayStatuses={mockDayStatuses}
        />

        {/* Stats bar */}
        <StatsBar stats={mockUserStats} />

        {/* Goal overview */}
        <GoalOverviewCard 
          yearGoal={mockYearGoal}
          nextMilestone="Complete Physics Mechanics"
          daysUntilMilestone={24}
        />

        {/* Section header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Today's Timeline
          </h2>
          <span className="text-xs text-muted-foreground font-mono-time">
            {mockTasks.filter(t => t.status === 'completed').length}/{mockTasks.length} completed
          </span>
        </div>

        {/* Timeline */}
        <Timeline 
          tasks={mockTasks} 
          onTaskClick={handleTaskClick}
        />

        {/* Floating action button */}
        <FloatingActionButton 
          timeOfDay={timeOfDay}
          onAction={handleFABAction}
        />
      </MobileLayout>
    </>
  );
};

export default Index;
