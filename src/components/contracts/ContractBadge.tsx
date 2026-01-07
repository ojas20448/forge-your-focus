import React from 'react';
import { Shield, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommitmentContract } from '@/hooks/useCommitmentContracts';
import { formatDistanceToNow, isPast } from 'date-fns';

interface ContractBadgeProps {
  contract: CommitmentContract;
  compact?: boolean;
  onClick?: () => void;
}

export const ContractBadge: React.FC<ContractBadgeProps> = ({
  contract,
  compact = false,
  onClick,
}) => {
  const isOverdue = isPast(new Date(contract.deadline));
  const timeLeft = formatDistanceToNow(new Date(contract.deadline), { addSuffix: true });

  const statusConfig = {
    active: {
      color: isOverdue ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-primary/10 border-primary/30 text-primary',
      icon: isOverdue ? <Clock className="w-3 h-3" /> : <Shield className="w-3 h-3" />,
      label: isOverdue ? 'Overdue!' : 'Active',
    },
    completed: {
      color: 'bg-success/10 border-success/30 text-success',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Completed',
    },
    failed: {
      color: 'bg-destructive/10 border-destructive/30 text-destructive',
      icon: <XCircle className="w-3 h-3" />,
      label: 'Failed',
    },
    cancelled: {
      color: 'bg-muted border-border text-muted-foreground',
      icon: <XCircle className="w-3 h-3" />,
      label: 'Cancelled',
    },
  };

  const config = statusConfig[contract.status];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors",
          config.color,
          onClick && "cursor-pointer hover:opacity-80"
        )}
      >
        {config.icon}
        <Zap className="w-3 h-3" />
        <span>{contract.staked_xp}</span>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border transition-all",
        config.color,
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-1 text-xp-glow">
          <Zap className="w-4 h-4" />
          <span className="font-bold">{contract.staked_xp}</span>
        </div>
      </div>
      
      {contract.status === 'active' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {timeLeft}
          </span>
        </div>
      )}

      {contract.buddy_email && (
        <div className="mt-2 text-xs text-muted-foreground">
          Buddy: {contract.buddy_email}
        </div>
      )}
    </div>
  );
};