import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Shield, Clock, Check, X, AlertTriangle, 
  Target, Zap, Calendar, Users, TrendingUp, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCommitmentContracts, CommitmentContract } from '@/hooks/useCommitmentContracts';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

interface ContractsOverviewScreenProps {
  onBack?: () => void;
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: Clock,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  completed: {
    label: 'Completed',
    icon: Check,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  failed: {
    label: 'Failed',
    icon: X,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
  },
};

const ContractCard: React.FC<{
  contract: CommitmentContract;
  onComplete?: () => void;
  onFail?: () => void;
  onCancel?: () => void;
}> = ({ contract, onComplete, onFail, onCancel }) => {
  const config = statusConfig[contract.status];
  const StatusIcon = config.icon;
  const deadline = parseISO(contract.deadline);
  const isOverdue = contract.status === 'active' && isPast(deadline);

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all",
      config.bgColor,
      config.borderColor,
      isOverdue && contract.status === 'active' && 'border-destructive animate-pulse'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            config.bgColor
          )}>
            <Shield className={cn("w-5 h-5", config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-bold font-mono-time", config.color)}>
                {contract.staked_xp} XP
              </span>
              {contract.status === 'completed' && (
                <span className="text-xs text-success">+{Math.floor(contract.staked_xp * 0.2)} bonus</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <StatusIcon className="w-3 h-3" />
              <span>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Type indicator */}
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          contract.task_id ? 'bg-primary/20 text-primary' : 'bg-manifestation/20 text-manifestation'
        )}>
          {contract.task_id ? (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Task
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Goal
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Deadline
          </span>
          <span className={cn(
            "font-medium",
            isOverdue && contract.status === 'active' ? 'text-destructive' : 'text-foreground'
          )}>
            {format(deadline, 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        {contract.status === 'active' && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Time remaining</span>
            <span className={cn(
              "font-medium",
              isOverdue ? 'text-destructive' : 'text-foreground'
            )}>
              {isOverdue ? 'Overdue!' : formatDistanceToNow(deadline, { addSuffix: false })}
            </span>
          </div>
        )}

        {contract.buddy_email && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Buddy
            </span>
            <span className="font-medium text-foreground truncate max-w-[150px]">
              {contract.buddy_email}
            </span>
          </div>
        )}

        {contract.resolved_at && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Resolved</span>
            <span className="text-foreground">
              {format(parseISO(contract.resolved_at), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Created</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(parseISO(contract.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions for active contracts */}
      {contract.status === 'active' && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
          <Button
            variant="success"
            size="sm"
            className="flex-1"
            onClick={onComplete}
          >
            <Check className="w-4 h-4 mr-1" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {isOverdue && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onFail}
            >
              Mark Failed
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const ContractsOverviewScreen: React.FC<ContractsOverviewScreenProps> = ({ onBack }) => {
  const { 
    contracts, 
    loading, 
    completeContract, 
    failContract, 
    cancelContract 
  } = useCommitmentContracts();

  const [activeTab, setActiveTab] = useState('active');

  const stats = useMemo(() => {
    const active = contracts.filter(c => c.status === 'active');
    const completed = contracts.filter(c => c.status === 'completed');
    const failed = contracts.filter(c => c.status === 'failed');
    
    const totalStaked = active.reduce((sum, c) => sum + c.staked_xp, 0);
    const totalWon = completed.reduce((sum, c) => sum + Math.floor(c.staked_xp * 0.2), 0);
    const totalLost = failed.reduce((sum, c) => sum + c.staked_xp, 0);
    const successRate = completed.length + failed.length > 0
      ? Math.round((completed.length / (completed.length + failed.length)) * 100)
      : 0;

    return {
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      totalStaked,
      totalWon,
      totalLost,
      successRate,
    };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (activeTab === 'active') {
      return contracts.filter(c => c.status === 'active');
    }
    if (activeTab === 'completed') {
      return contracts.filter(c => c.status === 'completed');
    }
    if (activeTab === 'history') {
      return contracts.filter(c => c.status !== 'active');
    }
    return contracts;
  }, [contracts, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading contracts...</div>
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
          <h1 className="text-xl font-bold text-foreground">Commitment Contracts</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Currently Staked</span>
            </div>
            <div className="text-2xl font-bold text-primary font-mono-time">
              {stats.totalStaked} XP
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.active} active contract{stats.active !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-success font-mono-time">
              {stats.successRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completed} completed
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">XP Won</span>
            </div>
            <div className="text-xl font-bold text-success font-mono-time">
              +{stats.totalWon} XP
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">XP Lost</span>
            </div>
            <div className="text-xl font-bold text-destructive font-mono-time">
              -{stats.totalLost} XP
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" className="relative">
              Active
              {stats.active > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground">
                  {stats.active}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="history">All History</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {activeTab === 'active' 
                    ? 'No active contracts' 
                    : activeTab === 'completed'
                    ? 'No completed contracts yet'
                    : 'No contract history'
                  }
                </p>
                <p className="text-xs mt-1">
                  {activeTab === 'active' && 'Create a contract from a task or goal to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContracts.map(contract => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onComplete={() => completeContract(contract.id)}
                    onFail={() => failContract(contract.id)}
                    onCancel={() => cancelContract(contract.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};
