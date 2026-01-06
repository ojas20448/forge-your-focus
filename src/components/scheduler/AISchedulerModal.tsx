import React, { useState } from 'react';
import { X, Mic, Send, Sparkles, Loader2, Clock, Target, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GeneratedTask {
  title: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  suggestedTime: string;
  linkedGoal?: string;
}

interface AISchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated?: (tasks: GeneratedTask[]) => void;
}

export const AISchedulerModal: React.FC<AISchedulerModalProps> = ({
  isOpen,
  onClose,
  onTasksGenerated
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  const examplePrompts = [
    "Study Physics for 2 hours",
    "Finish math worksheet and revise chemistry",
    "Deep work on project + gym in evening"
  ];

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockTasks: GeneratedTask[] = [
        {
          title: "Study Physics - Mechanics",
          duration: 90,
          priority: 'high',
          suggestedTime: "09:00 - 10:30",
          linkedGoal: "Crack JEE 2026"
        },
        {
          title: "Math Worksheet - Calculus",
          duration: 60,
          priority: 'medium',
          suggestedTime: "11:00 - 12:00",
          linkedGoal: "Crack JEE 2026"
        },
        {
          title: "Chemistry Revision",
          duration: 45,
          priority: 'medium',
          suggestedTime: "14:00 - 14:45"
        }
      ];
      
      setGeneratedTasks(mockTasks);
      setSelectedTasks(mockTasks.map((_, i) => i));
      setIsProcessing(false);
    }, 2000);
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setInput("Study Physics for 2 hours and complete the math assignment");
      setIsListening(false);
    }, 2000);
  };

  const toggleTaskSelection = (index: number) => {
    setSelectedTasks(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAddToSchedule = () => {
    const tasksToAdd = generatedTasks.filter((_, i) => selectedTasks.includes(i));
    onTasksGenerated?.(tasksToAdd);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger bg-danger/10 border-danger/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border-t border-x border-border rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Scheduler</h2>
              <p className="text-xs text-muted-foreground">Tell me what you need to do</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Example Prompts */}
          {!generatedTasks.length && !isProcessing && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try saying:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="px-3 py-1.5 text-xs rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
                <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Processing your request...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyzing tasks, optimizing schedule, linking to goals
                </p>
              </div>
            </div>
          )}

          {/* Generated Tasks */}
          {generatedTasks.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Generated Tasks</h3>
                <span className="text-xs text-muted-foreground">
                  {selectedTasks.length}/{generatedTasks.length} selected
                </span>
              </div>

              <div className="space-y-3">
                {generatedTasks.map((task, index) => (
                  <div
                    key={index}
                    onClick={() => toggleTaskSelection(index)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all duration-200",
                      selectedTasks.includes(index)
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        selectedTasks.includes(index)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}>
                        {selectedTasks.includes(index) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.duration}min
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {task.suggestedTime}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium border",
                            getPriorityColor(task.priority)
                          )}>
                            {task.priority}
                          </span>
                        </div>

                        {task.linkedGoal && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Target className="w-3 h-3 text-success" />
                            <span className="text-[10px] text-success">
                              Linked: {task.linkedGoal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full" 
                variant="glow"
                onClick={handleAddToSchedule}
                disabled={selectedTasks.length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Add {selectedTasks.length} Tasks to Schedule
              </Button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {!generatedTasks.length && !isProcessing && (
          <div className="p-4 border-t border-border bg-background/50">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                className={cn(
                  "shrink-0 transition-all",
                  isListening && "bg-danger/20 border-danger text-danger animate-pulse"
                )}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What do you need to accomplish?"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              
              <Button
                variant="glow"
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            {isListening && (
              <p className="text-xs text-center text-danger mt-2 animate-pulse">
                Listening... Speak now
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
