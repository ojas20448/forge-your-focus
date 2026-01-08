import React, { useState } from 'react';
import { X, Play, Clock, Target, Zap, Shield, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task } from '@/types/focusforge';
import { useCommitmentContracts } from '@/hooks/useCommitmentContracts';
import { CommitmentContractModal } from '@/components/contracts/CommitmentContractModal';
import { ContractBadge } from '@/components/contracts/ContractBadge';
import { DecayIndicator } from '@/components/decay/DecayIndicator';
import { useTasks } from '@/hooks/useTasks';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStartFocus,
}) => {
  const [showContractModal, setShowContractModal] = useState(false);
  const { getContractForTask, completeContract } = useCommitmentContracts();
  const { completeTask, deleteTask } = useTasks();
  
  const existingContract = getContractForTask(task.id);
  const isCompleted = task.status === 'completed';
  const isOverdue = task.decay_level > 0;
  
  // Check if task is scheduled for later
  const isScheduledForLater = new Date(task.scheduled_date) > new Date();

  if (!isOpen) return null;

  const handleComplete = async () => {
    await completeTask(task.id, task.xp_earned || 10);
    if (existingContract) {
      await completeContract(existingContract.id);
    }
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  const priorityConfig = {
    low: { color: 'bg-secondary text-muted-foreground', label: 'Low' },
    medium: { color: 'bg-warning/20 text-warning', label: 'Medium' },
    high: { color: 'bg-destructive/20 text-destructive', label: 'High' },
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className={cn(
                  "text-xl font-bold",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h2>
                {isCompleted && (
                  <Check className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  priorityConfig[task.priority].color
                )}>
                  {priorityConfig[task.priority].label}
                </span>
                {isOverdue && <DecayIndicator decayLevel={task.decay_level} size="sm" />}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Time info */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {task.suggested_block.start} - {task.suggested_block.end}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{task.duration_min} min</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="p-3 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            )}

            {/* Goal alignment */}
            {task.linked_goal_id && task.goal_alignment_score > 0.5 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  Aligned with your goal ({Math.round(task.goal_alignment_score * 100)}%)
                </span>
              </div>
            )}

            {/* XP reward */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-xp-glow/10 border border-xp-glow/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-xp-glow" />
                <span className="text-sm font-medium text-foreground">XP Reward</span>
              </div>
              <span className="font-bold text-xp-glow">+{task.xp_earned || 10} XP</span>
            </div>

            {/* Commitment Contract Section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Commitment Contract</h3>
              </div>

              {existingContract ? (
                <ContractBadge contract={existingContract} />
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Stake XP to increase accountability
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContractModal(true)}
                    disabled={isCompleted}
                    className="gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Create Contract
                  </Button>
                </div>
              )}
            </div>

            {/* Decay warning */}
            {isOverdue && !isCompleted && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive mb-1">Task is overdue!</p>
                  <p className="text-muted-foreground">
                    Complete it now to stop further XP decay
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-3">
            {!isCompleted && (
              <>
                <Button
                  variant="glow"
                  size="lg"
                  className="w-full gap-2"
                  onClick={onStartFocus}
                  disabled={isScheduledForLater}
                >
                  <Play className="w-5 h-5" />
                  {isScheduledForLater ? 'Scheduled for Later' : 'Start Focus Session'}
                </Button>
                
                {isScheduledForLater && (
                  <p className="text-xs text-muted-foreground text-center">
                    This task is scheduled for {new Date(task.scheduled_date).toLocaleString()}
                  </p>
                )}
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handleComplete}
                  >
                    <Check className="w-4 h-4" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
            
            {isCompleted && (
              <div className="text-center py-2">
                <span className="text-success font-medium flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Task Completed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract Creation Modal */}
      <CommitmentContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        taskId={task.id}
        targetTitle={task.title}
        suggestedDeadline={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      />
    </>
  );
};