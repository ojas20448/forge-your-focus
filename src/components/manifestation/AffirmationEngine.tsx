import React, { useState } from 'react';
import { 
  Plus, Trash2, Clock, Check, Volume2, ChevronLeft, 
  Flame, Bell, BellOff, Edit2, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAffirmations, Affirmation } from '@/hooks/useAffirmations';
import { notificationManager } from '@/utils/notificationManager';

interface AffirmationEngineProps {
  onBack?: () => void;
  onStartSession?: () => void;
}

export const AffirmationEngine: React.FC<AffirmationEngineProps> = ({ 
  onBack, 
  onStartSession 
}) => {
  const {
    affirmations,
    loading,
    createAffirmation,
    updateAffirmation,
    deleteAffirmation,
    getActiveAffirmations,
    isSessionCompletedToday,
    getCategories
  } = useAffirmations();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newScheduleTimes, setNewScheduleTimes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleAddAffirmation = async () => {
    if (!newText.trim()) return;
    
    await createAffirmation(
      newText.trim(),
      newCategory || undefined,
      newScheduleTimes.length > 0 ? newScheduleTimes : undefined
    );

    setNewText('');
    setNewCategory('');
    setNewScheduleTimes([]);
    setShowAddForm(false);
  };

  const handleToggleActive = async (aff: Affirmation) => {
    await updateAffirmation(aff.id, { is_active: !aff.is_active });
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddScheduleTime = () => {
    const defaultTime = '08:00';
    if (!newScheduleTimes.includes(defaultTime)) {
      setNewScheduleTimes([...newScheduleTimes, defaultTime]);
    }
  };

  const handleRemoveScheduleTime = (index: number) => {
    setNewScheduleTimes(newScheduleTimes.filter((_, i) => i !== index));
  };

  const handleUpdateScheduleTime = (index: number, time: string) => {
    const updated = [...newScheduleTimes];
    updated[index] = time;
    setNewScheduleTimes(updated);
  };

  const activeCount = getActiveAffirmations().length;
  const todayCompleted = isSessionCompletedToday('affirmation');
  const categories = getCategories();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading affirmations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center justify-between px-4 py-4">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-foreground">Affirmation Engine</h1>
          <div className="flex items-center gap-2">
            {todayCompleted && (
              <div className="px-2 py-1 rounded-full bg-success/20 border border-success/30">
                <Check className="w-4 h-4 text-success" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="text-2xl font-bold text-primary font-mono-time">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active Affirmations</div>
          </div>
          <div className="p-4 rounded-2xl bg-manifestation/10 border border-manifestation/20">
            <div className="text-2xl font-bold text-manifestation font-mono-time">
              {affirmations.reduce((sum, a) => sum + a.schedule_times.length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Daily Reminders</div>
          </div>
        </div>
      </section>

      {/* Start Session Button */}
      {activeCount > 0 && (
        <section className="px-4 pb-4">
          <Button
            variant="glow"
            className="w-full h-14 text-lg"
            onClick={onStartSession}
          >
            <Flame className="w-5 h-5 mr-2" />
            {todayCompleted ? 'Practice Again' : 'Start Session'}
          </Button>
        </section>
      )}

      {/* Affirmations List */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Affirmations
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {affirmations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No affirmations yet</p>
            <p className="text-xs mt-1">Add your first affirmation to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {affirmations.map((aff) => (
              <div
                key={aff.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all",
                  aff.is_active 
                    ? "bg-card border-border hover:border-primary/30" 
                    : "bg-muted/50 border-border/50 opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleSpeak(aff.text)}
                    className={cn(
                      "p-2 rounded-lg transition-colors shrink-0",
                      isSpeaking ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      "{aff.text}"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {aff.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                          {aff.category}
                        </span>
                      )}
                      {aff.schedule_times.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Bell className="w-3 h-3" />
                          {aff.schedule_times.length} reminder{aff.schedule_times.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={aff.is_active}
                      onCheckedChange={() => handleToggleActive(aff)}
                    />
                    <button
                      onClick={() => deleteAffirmation(aff.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Schedule times */}
                {aff.schedule_times.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                    {aff.schedule_times.map((time, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-primary/10 text-xs font-mono-time text-primary"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Affirmation Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="p-2 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">New Affirmation</h2>
            <div className="w-8" />
          </header>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Affirmation text */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Your Affirmation
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="I am capable of achieving my goals..."
                className="w-full h-24 p-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat === newCategory ? '' : cat!)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      newCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Or type a custom category..."
                className="mt-2"
              />
            </div>

            {/* Schedule times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Daily Reminders
                </label>
                <Button variant="ghost" size="sm" onClick={handleAddScheduleTime}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Time
                </Button>
              </div>

              {newScheduleTimes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No reminders set. Add times to receive notifications.
                </p>
              ) : (
                <div className="space-y-2">
                  {newScheduleTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleUpdateScheduleTime(idx, e.target.value)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => handleRemoveScheduleTime(idx)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <Button 
              variant="glow" 
              className="w-full"
              onClick={handleAddAffirmation}
              disabled={!newText.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Affirmation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
