import React, { useState } from 'react';
import { X, Zap, Users, Calendar, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useCommitmentContracts } from '@/hooks/useCommitmentContracts';
import { useProfile } from '@/hooks/useProfile';

interface CommitmentContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  goalId?: string;
  targetTitle: string;
  suggestedDeadline?: Date;
}

export const CommitmentContractModal: React.FC<CommitmentContractModalProps> = ({
  isOpen,
  onClose,
  taskId,
  goalId,
  targetTitle,
  suggestedDeadline,
}) => {
  const { profile } = useProfile();
  const { createContract, creating } = useCommitmentContracts();
  
  const maxStake = Math.min(profile?.total_xp || 0, 500);
  const [stakedXp, setStakedXp] = useState(Math.min(50, maxStake));
  const [buddyEmail, setBuddyEmail] = useState('');
  const [deadline, setDeadline] = useState(
    suggestedDeadline?.toISOString().split('T')[0] || 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleCreate = async () => {
    const success = await createContract({
      taskId: taskId || null,
      goalId: goalId || null,
      stakedXp,
      buddyEmail: buddyEmail.trim() || null,
      deadline: new Date(deadline),
    });

    if (success) {
      onClose();
    }
  };

  const riskLevel = stakedXp <= 50 ? 'low' : stakedXp <= 150 ? 'medium' : 'high';
  const riskColors = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-destructive bg-destructive/10',
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Commitment Contract</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Target */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Committing to</p>
            <p className="font-semibold text-foreground">{targetTitle}</p>
          </div>

          {/* XP Stake */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-xp-glow" />
                XP at Stake
              </Label>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium capitalize",
                riskColors[riskLevel]
              )}>
                {riskLevel} risk
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Slider
                value={[stakedXp]}
                onValueChange={([val]) => setStakedXp(val)}
                max={maxStake}
                min={10}
                step={10}
                className="flex-1"
              />
              <span className="font-mono text-lg font-bold text-xp-glow w-16 text-right">
                {stakedXp}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              You have {profile?.total_xp || 0} XP. Stake up to {maxStake} XP.
            </p>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Deadline
            </Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          {/* Accountability Buddy */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Accountability Buddy (Optional)
            </Label>
            <Input
              type="email"
              value={buddyEmail}
              onChange={(e) => setBuddyEmail(e.target.value)}
              placeholder="buddy@email.com"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              They'll be notified of your progress and deadline
            </p>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">Failure Penalty</p>
              <p className="text-muted-foreground">
                If you don't complete by the deadline, you'll lose {stakedXp} XP permanently.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="glow"
            size="lg"
            className="w-full"
            onClick={handleCreate}
            disabled={creating || stakedXp < 10}
          >
            {creating ? 'Creating...' : `Stake ${stakedXp} XP & Commit`}
          </Button>
        </div>
      </div>
    </div>
  );
};