import React from 'react';
import { Book, Brain, Dumbbell, Eye, Coffee, Check, AlertTriangle, Clock, Shield } from 'lucide-react';
import { Task, TaskStatus, TaskType } from '@/types/focusforge';
import { cn } from '@/lib/utils';
import { DecayIndicator } from '@/components/decay/DecayIndicator';
import { TaskDecayIndicator } from '@/components/tasks/TaskDecayIndicator';
import { useCommitmentContracts } from '@/hooks/useCommitmentContracts';

interface TaskBlockProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

const taskIcons: Record<TaskType, React.ReactNode> = {
  study: <Book className="w-4 h-4" />,
  deepwork: <Brain className="w-4 h-4" />,
  physical: <Dumbbell className="w-4 h-4" />,
  manifestation: <Eye className="w-4 h-4" />,
  break: <Coffee className="w-4 h-4" />,
};

const statusStyles: Record<TaskStatus, string> = {
  pending: 'border-border/30 hover:border-primary/30',
  active: 'border-primary border-2 shadow-lg shadow-primary/20',
  completed: 'border-success/30 opacity-70',
  rotten: 'border-rotten/50 border-dashed',
  violated: 'border-accent border-2',
};

const priorityColors = {
  low: 'bg-secondary',
  medium: 'bg-warning/80',
  high: 'bg-accent',
};

export const TaskBlock: React.FC<TaskBlockProps> = ({ task, onTaskClick }) => {
  const { getContractForTask } = useCommitmentContracts();
  const contract = getContractForTask(task.id);
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasDecay = task.decay_level > 0 && task.status !== 'completed';

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-success" />;
      case 'violated':
        return <AlertTriangle className="w-4 h-4 text-accent" />;
      case 'rotten':
        return <Clock className="w-4 h-4 text-rotten-foreground" />;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={() => onTaskClick?.(task)}
      className={cn(
        "w-full text-left ml-14 mr-4 p-4 rounded-2xl border transition-all duration-300 bg-card/80 backdrop-blur-sm",
        statusStyles[task.status],
        task.status === 'active' && 'scale-[1.02]',
        hasDecay && 'border-destructive/30',
        // Visual decay animations
        task.decay_level === 2 && 'animate-pulse border-rotten/50', // Rotten: pulsing
        task.decay_level === 1 && 'opacity-90', // Overdue: slightly faded
      )}
    >
      <div className="flex items-start gap-3">
        {/* Task type icon with decay effect */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
          task.type === 'manifestation' 
            ? 'bg-manifestation/20 text-manifestation'
            : task.type === 'break'
            ? 'bg-secondary/50 text-muted-foreground'
            : 'bg-primary/20 text-primary',
          // Decay visual effects on icon
          task.decay_level === 2 && 'bg-rotten/20 text-rotten-foreground', // Rotten: change colors
          task.decay_level === 1 && 'opacity-80', // Overdue: slightly dimmed
        )}>
          {taskIcons[task.type]}
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              task.status === 'completed' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h4>
            {task.priority === 'high' && task.status !== 'completed' && (
              <div className={cn("w-2 h-2 rounded-full", priorityColors[task.priority])} />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-xs font-mono-time">
              {task.suggested_block.start} - {task.suggested_block.end}
            </span>
            <span>•</span>
            <span>{task.duration_min}min</span>
            {task.verification_required && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">Verified</span>
              </>
            )}
          </div>

          {/* Decay and Contract indicators */}
          <div className="flex items-center gap-2 mt-2">
            {hasDecay && (
              <TaskDecayIndicator decayLevel={task.decay_level} showLabel />
            )}
            {contract && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Shield className="w-3 h-3" />
                <span>{contract.staked_xp} XP</span>
              </div>
            )}
          </div>
          {/* Subtasks progress */}
          {totalSubtasks > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono-time text-muted-foreground">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Goal alignment indicator */}
          {task.linked_goal_id && task.goal_alignment_score > 0.6 && (
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-success rounded-full" />
              <span className="text-[10px] text-primary font-medium">
                Goal aligned
              </span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="shrink-0">
          {getStatusIcon()}
        </div>
      </div>
    </button>
  );
};
