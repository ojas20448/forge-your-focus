import React from 'react';
import { Task } from '@/types/focusforge';
import { TimeSpine, TimeMarker } from './TimeSpine';
import { TaskBlock } from './TaskBlock';
import { BreakBlock } from './BreakBlock';

interface TimelineProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ tasks, onTaskClick }) => {
  // Calculate current time percentage (6am to 11pm = 17 hours)
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const dayStartHour = 6;
  const dayEndHour = 23;
  const totalDayMinutes = (dayEndHour - dayStartHour) * 60;
  const currentMinutes = (hours - dayStartHour) * 60 + minutes;
  const currentTimePercent = Math.max(0, Math.min(100, (currentMinutes / totalDayMinutes) * 100));

  // Generate time markers
  const timeMarkers = [];
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 2) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeMarkers.push({
      time,
      isCurrentHour: hour === hours || hour === hours - 1,
    });
  }

  // Sort tasks by start time
  const sortedTasks = [...tasks].sort((a, b) => 
    a.suggested_block.start.localeCompare(b.suggested_block.start)
  );

  // Check if there should be a break between tasks
  const getBreakBetweenTasks = (currentTask: Task, nextTask: Task) => {
    const currentEnd = currentTask.suggested_block.end;
    const nextStart = nextTask.suggested_block.start;
    
    if (currentEnd < nextStart) {
      const [currentEndHour, currentEndMin] = currentEnd.split(':').map(Number);
      const [nextStartHour, nextStartMin] = nextStart.split(':').map(Number);
      const breakDuration = (nextStartHour * 60 + nextStartMin) - (currentEndHour * 60 + currentEndMin);
      
      if (breakDuration >= 5 && breakDuration <= 30) {
        return {
          duration: breakDuration,
          startTime: currentEnd,
          endTime: nextStart,
        };
      }
    }
    return null;
  };

  return (
    <div className="relative px-4 py-6 min-h-[600px]">
      {/* Time spine */}
      <TimeSpine currentTimePercent={currentTimePercent} />

      {/* Timeline content */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <React.Fragment key={task.id}>
            {/* Time marker before task */}
            {(index === 0 || sortedTasks[index - 1].suggested_block.end !== task.suggested_block.start) && (
              <div className="flex items-center">
                <span className="text-xs font-mono-time w-10 text-right text-muted-foreground">
                  {task.suggested_block.start}
                </span>
                <div className="w-2 h-2 ml-3 rounded-full bg-primary/50" />
              </div>
            )}

            {/* Task block */}
            <TaskBlock task={task} onTaskClick={onTaskClick} />

            {/* Break between tasks */}
            {index < sortedTasks.length - 1 && (
              (() => {
                const breakInfo = getBreakBetweenTasks(task, sortedTasks[index + 1]);
                if (breakInfo) {
                  return (
                    <BreakBlock
                      duration={breakInfo.duration}
                      startTime={breakInfo.startTime}
                      endTime={breakInfo.endTime}
                    />
                  );
                }
                return null;
              })()
            )}
          </React.Fragment>
        ))}

        {/* Empty state */}
        {sortedTasks.length === 0 && (
          <div className="ml-14 mr-4 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <span className="text-4xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks scheduled</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Start by adding a task to build your perfect day
            </p>
            <div className="space-y-2 text-left w-full max-w-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Examples:</p>
              <div className="space-y-1.5">
                {[
                  { emoji: '📚', text: 'Study session (60-90 min)' },
                  { emoji: '💪', text: 'Workout (30-45 min)' },
                  { emoji: '🎯', text: 'Project work (2 hours)' },
                ].map((example, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{example.emoji}</span>
                    <span>{example.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary font-medium">
                💡 Tap the button below to add your first task
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
