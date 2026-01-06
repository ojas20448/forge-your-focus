import React, { useState } from 'react';
import { Play, Pause, Eye, Flame, BookOpen, ChevronLeft, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ManifestationScreenProps {
  onBack?: () => void;
}

interface Affirmation {
  id: string;
  text: string;
  completed: boolean;
}

export const ManifestationScreen: React.FC<ManifestationScreenProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSession, setCurrentSession] = useState<'affirmation' | 'visualization' | 'journal' | null>(null);
  const [affirmations] = useState<Affirmation[]>([
    { id: '1', text: "I am focused and disciplined in my studies.", completed: true },
    { id: '2', text: "Every problem I solve makes me stronger.", completed: true },
    { id: '3', text: "I will achieve my target rank through consistent effort.", completed: false },
  ]);

  const [journalEntry, setJournalEntry] = useState('');
  const [manifestationStreak] = useState(8);

  const completedAffirmations = affirmations.filter(a => a.completed).length;

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
          <h1 className="text-xl font-bold text-foreground">Manifestation</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-manifestation/20 border border-manifestation/30">
            <Flame className="w-4 h-4 text-manifestation" />
            <span className="text-sm font-bold text-manifestation font-mono-time">{manifestationStreak}d</span>
          </div>
        </div>
      </header>

      {/* Daily rituals */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Today's Rituals
        </h2>
        
        <div className="space-y-3">
          {/* Visualization session */}
          <button
            onClick={() => setCurrentSession('visualization')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
              "bg-card hover:bg-card/80 border-border/50 hover:border-manifestation/30"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-manifestation/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-manifestation" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">Morning Visualization</h3>
              <p className="text-xs text-muted-foreground">2 min guided session</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
          </button>

          {/* Affirmations */}
          <button
            onClick={() => setCurrentSession('affirmation')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
              "bg-card hover:bg-card/80 border-border/50 hover:border-manifestation/30"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">Daily Affirmations</h3>
              <p className="text-xs text-muted-foreground">{completedAffirmations}/{affirmations.length} completed</p>
            </div>
            <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${(completedAffirmations / affirmations.length) * 100}%` }}
              />
            </div>
          </button>

          {/* Journaling */}
          <button
            onClick={() => setCurrentSession('journal')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
              "bg-card hover:bg-card/80 border-border/50 hover:border-manifestation/30"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">Evening Reflection</h3>
              <p className="text-xs text-muted-foreground">Log your wins & learnings</p>
            </div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </button>
        </div>
      </section>

      {/* Vision Board Preview */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Vision Board
          </h2>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-gradient-to-br from-secondary to-muted/50 border border-border/50 flex items-center justify-center"
            >
              <span className="text-2xl">
                {['🎯', '📚', '🏆', '💪', '🧠', '✨'][i - 1]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick journal */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Journal
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <textarea
            placeholder="What would success look like today? Write freely..."
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            className="w-full h-24 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm"
          />
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {journalEntry.length} characters
            </span>
            <Button variant="glow" size="sm" disabled={!journalEntry.trim()}>
              Save Entry
            </Button>
          </div>
        </div>
      </section>

      {/* Visualization session modal */}
      {currentSession === 'visualization' && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={() => setCurrentSession(null)} className="p-2 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">Visualization</h2>
            <div className="w-8" />
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500",
              isPlaying ? "bg-manifestation/30 glow-manifestation" : "bg-secondary"
            )}>
              <Eye className={cn(
                "w-16 h-16 transition-all duration-500",
                isPlaying ? "text-manifestation" : "text-muted-foreground"
              )} />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              {isPlaying ? "Visualize your success..." : "Ready to begin?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              {isPlaying 
                ? "Close your eyes. See yourself achieving your goal. Feel the success."
                : "Find a quiet space. Take a deep breath. When ready, press play."
              }
            </p>

            <Button
              variant={isPlaying ? "danger" : "manifestation"}
              size="xl"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full w-20 h-20"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
