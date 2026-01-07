import React, { useState } from 'react';
import { X, Plus, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate 
}) => {
  const { createTask } = useTasks();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    startTime: '09:00',
    duration: 60,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const calculateEndTime = (start: string, durationMin: number) => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMin;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a task title',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const endTime = calculateEndTime(formData.startTime, formData.duration);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      await createTask({
        title: formData.title,
        description: '',
        priority: formData.priority,
        scheduled_date: dateStr,
        start_time: formData.startTime,
        end_time: endTime,
        duration_minutes: formData.duration,
        xp_reward: formData.duration >= 60 ? 20 : 10,
      });

      toast({
        title: 'Task added!',
        description: `${formData.title} scheduled for ${formData.startTime}`,
      });

      // Reset form
      setFormData({
        title: '',
        startTime: '09:00',
        duration: 60,
        priority: 'medium',
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to add task',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const priorityOptions = [
    { value: 'low' as const, label: 'Low', color: 'bg-muted' },
    { value: 'medium' as const, label: 'Medium', color: 'bg-warning' },
    { value: 'high' as const, label: 'High', color: 'bg-accent' },
  ];

  const commonDurations = [15, 30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border-t border-x border-border rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Quick Add Task</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What do you need to do?</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Study Physics Chapter 5"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Ends at: {calculateEndTime(formData.startTime, formData.duration)}
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Duration</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="w-20 text-center">
                <span className="text-xl font-bold font-mono-time text-primary">
                  {formData.duration}
                </span>
                <span className="text-xs text-muted-foreground block">min</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {commonDurations.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setFormData({ ...formData, duration })}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    formData.duration === duration
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  {duration}m
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm",
                    formData.priority === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            variant="glow"
            onClick={handleSubmit}
            className="flex-1"
            disabled={saving || !formData.title.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
