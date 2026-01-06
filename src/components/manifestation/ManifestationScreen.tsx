import React, { useState } from 'react';
import { Play, Pause, Eye, Flame, BookOpen, ChevronLeft, Plus, Check, Image, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VisionBoardScreen } from './VisionBoardScreen';

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
  const [showVisionBoard, setShowVisionBoard] = useState(false);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([
    { id: '1', text: "I am focused and disciplined in my studies.", completed: true },
    { id: '2', text: "Every problem I solve makes me stronger.", completed: true },
    { id: '3', text: "I will achieve my target rank through consistent effort.", completed: false },
  ]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [journalEntry, setJournalEntry] = useState('');
  const [manifestationStreak] = useState(8);

  const completedAffirmations = affirmations.filter(a => a.completed).length;

  const handleSpeakAffirmation = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const markAffirmationComplete = (id: string) => {
    setAffirmations(prev => prev.map(a => 
      a.id === id ? { ...a, completed: true } : a
    ));
  };

  if (showVisionBoard) {
    return <VisionBoardScreen onBack={() => setShowVisionBoard(false)} />;
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
          <Button variant="ghost" size="sm" onClick={() => setShowVisionBoard(true)}>
            <Image className="w-4 h-4 mr-1" />
            Open
          </Button>
        </div>

        <button
          onClick={() => setShowVisionBoard(true)}
          className="w-full grid grid-cols-3 gap-2"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-gradient-to-br from-secondary to-muted/50 border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl">
                {['🎯', '📚', '🏆', '💪', '🧠', '✨'][i - 1]}
              </span>
            </div>
          ))}
        </button>
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
              size="lg"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full w-20 h-20"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
          </div>
        </div>
      )}

      {/* Affirmation session modal */}
      {currentSession === 'affirmation' && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={() => setCurrentSession(null)} className="p-2 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">Affirmations</h2>
            <span className="text-xs text-muted-foreground">{currentAffirmationIndex + 1}/{affirmations.length}</span>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-8",
              affirmations[currentAffirmationIndex]?.completed ? "bg-success/20" : "bg-primary/20"
            )}>
              {affirmations[currentAffirmationIndex]?.completed ? (
                <Check className="w-12 h-12 text-success" />
              ) : (
                <Flame className="w-12 h-12 text-primary" />
              )}
            </div>

            <p className="text-xl font-semibold text-foreground mb-8 max-w-sm">
              "{affirmations[currentAffirmationIndex]?.text}"
            </p>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSpeakAffirmation(affirmations[currentAffirmationIndex]?.text)}
                className={cn(isSpeaking && "bg-primary/20 border-primary")}
              >
                <Volume2 className={cn("w-5 h-5", isSpeaking && "text-primary animate-pulse")} />
              </Button>
              
              {!affirmations[currentAffirmationIndex]?.completed && (
                <Button
                  variant="success"
                  onClick={() => markAffirmationComplete(affirmations[currentAffirmationIndex]?.id)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  I believe this
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentAffirmationIndex(Math.max(0, currentAffirmationIndex - 1))}
              disabled={currentAffirmationIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (currentAffirmationIndex === affirmations.length - 1) {
                  setCurrentSession(null);
                } else {
                  setCurrentAffirmationIndex(currentAffirmationIndex + 1);
                }
              }}
            >
              {currentAffirmationIndex === affirmations.length - 1 ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      )}

      {/* Journal session modal */}
      {currentSession === 'journal' && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={() => setCurrentSession(null)} className="p-2 rounded-lg hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">Evening Reflection</h2>
            <div className="w-8" />
          </header>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What wins did you achieve today?
              </label>
              <textarea
                placeholder="List your accomplishments, big or small..."
                className="w-full h-24 p-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What did you learn?
              </label>
              <textarea
                placeholder="Insights, lessons, or realizations..."
                className="w-full h-24 p-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What are you grateful for?
              </label>
              <textarea
                placeholder="Three things you're thankful for..."
                className="w-full h-24 p-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <Button variant="glow" className="w-full" onClick={() => setCurrentSession(null)}>
              <Check className="w-4 h-4 mr-2" />
              Save Reflection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
