import React, { useState, useEffect } from 'react';
import { X, Mic, Send, Sparkles, Loader2, Clock, Target, Zap, Check, Sun, Moon, Coffee, AlertCircle, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EnergyProfile, Task } from '@/types/focusforge';
import { createGeminiScheduler, GeneratedTask as GeminiTask } from '@/utils/geminiScheduler';
import { useVoiceRecognition } from '@/utils/voiceRecognition';
import { parseDeadline, findBestDeadline } from '@/utils/deadlineParser';
import { parseRecurringTask, generateRecurringDates } from '@/utils/recurringTasks';

const energySchedulingProfiles = {
  morning_lark: { peak: { start: 6, end: 12 }, low: { start: 18, end: 23 } },
  night_owl: { peak: { start: 18, end: 23 }, low: { start: 6, end: 12 } },
  balanced: { peak: { start: 9, end: 17 }, low: { start: 0, end: 6 } },
};
import { useTasks, CreateTaskInput } from '@/hooks/useTasks';
import { format, addDays } from 'date-fns';

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
  energyProfile?: EnergyProfile;
  existingTasks?: Task[];
  goals?: Array<{ title: string; id?: string }>;
  selectedDate?: Date;
}

export const AISchedulerModal: React.FC<AISchedulerModalProps> = ({
  isOpen,
  onClose,
  onTasksGenerated,
  energyProfile = 'balanced',
  existingTasks = [],
  goals = [],
  selectedDate = new Date()
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const { createBulkTasks } = useTasks();
  const { isListening: voiceIsListening, transcript, error: voiceError, isSupported, startListening, stopListening, clearTranscript } = useVoiceRecognition();

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Show voice error if any
  useEffect(() => {
    if (voiceError) {
      setError(voiceError);
    }
  }, [voiceError]);

  const examplePrompts = [
    "Study Physics for 2 hours",
    "Finish math worksheet and revise chemistry",
    "Deep work on project + gym in evening"
  ];

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const useRealAI = useAI && apiKey && apiKey !== 'YOUR_API_KEY_HERE';

    if (useRealAI) {
      // Use real Gemini AI
      try {
        const scheduler = createGeminiScheduler(apiKey);
        const aiTasks = await scheduler.generateSchedule({
          userInput: input,
          energyProfile,
          existingTasks: existingTasks.map(t => ({
            title: t.title,
            time: `${t.suggested_block.start} - ${t.suggested_block.end}`
          })),
          goals: goals,
          currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });

        // Convert Gemini tasks to our format
        const converted: GeneratedTask[] = aiTasks.map(task => ({
          title: task.title,
          duration: task.duration,
          priority: task.priority,
          suggestedTime: task.suggestedTime,
          linkedGoal: task.linkedGoal
        }));

        setGeneratedTasks(converted);
        setSelectedTasks(converted.map((_, i) => i));
        setIsProcessing(false);
      } catch (err) {
        console.error('AI scheduling error:', err);
        setError(err instanceof Error ? err.message : 'AI scheduling failed');
        setIsProcessing(false);
        // Fallback to mock
        generateMockTasks();
      }
    } else {
      // Use mock scheduling (fallback)
      generateMockTasks();
    }
  };

  const formatTimeFromMinutes = (totalMinutes: number) => {
    const minutesInDay = 24 * 60;
    const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const generateMockTasks = () => {
    setTimeout(() => {
      const profile = energySchedulingProfiles[energyProfile];
      const peakStart = profile.peak.start;
      const peakEnd = profile.peak.end;

      const peakStartMinutes = peakStart * 60;
      const peakEndMinutes = peakEnd * 60;
      
      // Generate tasks scheduled based on energy profile
      const mockTasks: GeneratedTask[] = [
        {
          title: "Study Physics - Mechanics",
          duration: 90,
          priority: 'high',
          suggestedTime: `${formatTimeFromMinutes(peakStartMinutes)} - ${formatTimeFromMinutes(peakStartMinutes + 90)}`,
          linkedGoal: "Crack JEE 2026"
        },
        {
          title: "Math Worksheet - Calculus",
          duration: 60,
          priority: 'medium',
          suggestedTime: `${formatTimeFromMinutes(peakStartMinutes + 120)} - ${formatTimeFromMinutes(peakStartMinutes + 180)}`,
          linkedGoal: "Crack JEE 2026"
        },
    if (voiceIsListening) {
      stopListening();
      setIsListening(false);
    } else {
      clearTranscript();
      setError(null);
      startListening();
      setIsListening(true);
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

  const heck if this is a recurring task
    const recurringInfo = parseRecurringTask(input);
    const deadline = findBestDeadline(input, selectedDate);
    
    // Convert to database format and save
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const taskInputs: CreateTaskInput[] = [];

    // Generate recurring tasks if detected
    if (recurringInfo.recurrence && recurringInfo.recurrence.confidence >= 0.7) {
      const dates = generateRecurringDates(
        selectedDate,
        recurringInfo.recurrence.pattern,
        {
          interval: recurringInfo.recurrence.interval,
          daysOfWeek: recurringInfo.recurrence.daysOfWeek,
          occurrences: 12, // Generate 12 occurrences
          endDate: deadline?.date || addDays(selectedDate, 90), // 3 months default
        }
      );

      // Create recurring task instances
      dates.forEach(date => {
        tasksToAdd.forEach(task => {
          const [startTime, endTime] = task.suggestedTime.split(' - ').map(t => t.trim());
          taskInputs.push({
            title: task.title,
            description: `Recurring: ${recurringInfo.recurrence!.parsedFrom}`,
            priority: task.priority,
            scheduled_date: format(date, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            duration_minutes: recurringInfo.duration || task.duration,
            goal_id: goals.find(g => g.title === task.linkedGoal)?.id,
            xp_reward: (recurringInfo.duration || task.duration) >= 60 ? 20 : 10,
          });
        });
      });
    } else {
      // Regular one-time tasks
      tasksToAdd.forEach(task => {
        const [startTime, endTime] = task.suggestedTime.split(' - ').map(t => t.trim());
        const taskDate = deadline?.date || selectedDate;
        taskInputs.push({
          title: task.title,
          description: deadline ? `Deadline: ${deadline.parsedFrom}` : '',
          priority: task.priority,
          scheduled_date: format(taskDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          duration_minutes: task.duration,
          goal_id: goals.find(g => g.title === task.linkedGoal)?.id,
          xp_reward: task.duration >= 60 ? 20 : 10,
        });
      });
    } goal_id: goals.find(g => g.title === task.linkedGoal)?.id,
        xp_reward: task.duration >= 60 ? 20 : 10,
      };
    });

    await createBulkTasks(taskInputs);
    onTasksGenerated?.(tasksToAdd);
    setGeneratedTasks([]);
    setSelectedTasks([]);
    setInput('');
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
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {energyProfile === 'morning_lark' && <><Sun className="w-3 h-3" /> Morning Lark Mode</>}
                {energyProfile === 'night_owl' && <><Moon className="w-3 h-3" /> Night Owl Mode</>}
                {energyProfile === 'balanced' && <><Coffee className="w-3 h-3" /> Balanced Mode</>}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Error Display */}
          {error && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-accent">AI Scheduling Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Using fallback scheduling. Add your Gemini API key to .env for AI features.
                </p>
              </div>
            </div>
          )}

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
                disabled={!isSupported}
                title={!isSupported ? "Voice recognition not supported in this browser" : voiceIsListening ? "Stop listening" : "Start voice input"}
                className={cn(
                  "shrink-0 transition-all",
                  voiceIsListening && "bg-danger/20 border-danger text-danger animate-pulse"
                )}
              >
                {voiceIsListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
