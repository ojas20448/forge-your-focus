import React from 'react';
import { TrendingUp, Brain, Flame, Users, AlertTriangle, Target, Clock, Award, ChevronRight } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const AnalyticsDashboard: React.FC = () => {
  const { weeklyReport, burnoutAnalysis, comparative, predictions, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Analyzing your productivity patterns...</p>
        </div>
      </div>
    );
  }

  if (!weeklyReport) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">No Data Available</h2>
          <p className="text-muted-foreground">Complete some tasks to see your analytics</p>
        </div>
      </div>
    );
  }

  const getBurnoutColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/50';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
      default: return 'text-green-500 bg-green-500/10 border-green-500/50';
    }
  };

  const getCognitiveLoadColor = (load: string) => {
    switch (load) {
      case 'peak': return 'bg-purple-500';
      case 'high': return 'bg-blue-500';
      case 'medium': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20 p-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Advanced Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(weeklyReport.weekStart), 'MMM d')} - {format(new Date(weeklyReport.weekEnd), 'MMM d, yyyy')}
        </p>
      </header>

      <div className="p-4 space-y-6">
        {/* Weekly Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
              <p className="text-2xl font-bold">{weeklyReport.summary.totalXp.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Focus Hours</p>
              </div>
              <p className="text-2xl font-bold">{weeklyReport.summary.totalFocusHours}h</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              <p className="text-2xl font-bold">{weeklyReport.summary.tasksCompleted}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <p className="text-2xl font-bold">{weeklyReport.summary.streakDays} days</p>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${weeklyReport.summary.completionRate * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold">{Math.round(weeklyReport.summary.completionRate * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Burnout Analysis */}
        {burnoutAnalysis && (
          <div className={cn("border-2 rounded-2xl p-6 space-y-4", getBurnoutColor(burnoutAnalysis.riskLevel))}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Burnout Analysis
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase">
                {burnoutAnalysis.riskLevel} Risk
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Burnout Score</span>
                <span className="font-bold">{burnoutAnalysis.burnoutScore}/100</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", 
                    burnoutAnalysis.burnoutScore > 75 ? 'bg-red-500' :
                    burnoutAnalysis.burnoutScore > 50 ? 'bg-orange-500' :
                    burnoutAnalysis.burnoutScore > 25 ? 'bg-yellow-500' :
                    'bg-green-500'
                  )}
                  style={{ width: `${burnoutAnalysis.burnoutScore}%` }}
                />
              </div>
            </div>

            {burnoutAnalysis.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Warnings:</p>
                {burnoutAnalysis.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-lg">⚠️</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {burnoutAnalysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Recommendations:</p>
                {burnoutAnalysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-lg">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cognitive Load Patterns */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Cognitive Load by Hour
          </h2>
          <p className="text-sm text-muted-foreground">Your peak productivity hours</p>
          
          <div className="space-y-2">
            {weeklyReport.cognitiveLoadPatterns
              .filter(p => p.avgFocusMinutes > 0)
              .sort((a, b) => b.energyLevel - a.energyLevel)
              .slice(0, 8)
              .map((pattern) => (
                <div key={pattern.hour} className="flex items-center gap-3">
                  <span className="text-sm font-mono w-12">{pattern.hour}:00</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className={cn("h-full flex items-center px-2 text-xs text-white transition-all", 
                          getCognitiveLoadColor(pattern.cognitiveLoad)
                        )}
                        style={{ width: `${pattern.energyLevel}%` }}
                      >
                        {pattern.energyLevel > 30 && (
                          <span className="font-semibold">{pattern.energyLevel}%</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs uppercase font-semibold w-16 text-right">
                      {pattern.cognitiveLoad}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Productivity Heatmap */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Productivity Heatmap</h2>
          <p className="text-sm text-muted-foreground">When you're most productive</p>
          
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1 min-w-max">
              {/* Hour labels */}
              <div className="flex gap-1">
                <div className="w-12" />
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="w-8 text-xs text-center text-muted-foreground">
                    {i}
                  </div>
                ))}
              </div>
              
              {/* Day rows */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                <div key={day} className="flex gap-1 items-center">
                  <div className="w-12 text-xs text-muted-foreground">{day}</div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = weeklyReport.productivityHeatmap.find(
                      h => h.dayOfWeek === dayIndex && h.hour === hour
                    );
                    const score = cell?.productivityScore || 0;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "w-8 h-8 rounded transition-colors",
                          score === 0 ? 'bg-secondary' :
                          score < 25 ? 'bg-green-500/20' :
                          score < 50 ? 'bg-green-500/40' :
                          score < 75 ? 'bg-green-500/60' :
                          'bg-green-500'
                        )}
                        title={`${day} ${hour}:00 - ${score} score`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Predictions */}
        {predictions.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Risk Predictions
            </h2>
            <p className="text-sm text-muted-foreground">Tasks likely to fail</p>
            
            <div className="space-y-3">
              {predictions.slice(0, 5).map((prediction) => (
                <div key={prediction.taskId} className="p-4 bg-secondary rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold flex-1">{prediction.taskTitle}</p>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      prediction.failureProbability > 0.7 ? 'bg-red-500/20 text-red-500' :
                      prediction.failureProbability > 0.5 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    )}>
                      {Math.round(prediction.failureProbability * 100)}% risk
                    </span>
                  </div>
                  
                  {prediction.riskFactors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {prediction.riskFactors.map((factor, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {factor}</p>
                      ))}
                    </div>
                  )}
                  
                  {prediction.recommendations.length > 0 && (
                    <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                      <p className="text-xs font-semibold mb-1">💡 Recommendations:</p>
                      {prediction.recommendations.slice(0, 2).map((rec, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparative Analysis */}
        {comparative && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              League Comparison
            </h2>
            
            <div className="text-center p-4 bg-primary/10 rounded-xl">
              <p className="text-4xl font-bold text-primary mb-1">
                #{comparative.rank}
              </p>
              <p className="text-sm text-muted-foreground">
                Top {100 - comparative.percentile}% • {comparative.percentile}th percentile
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Your Performance</p>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Weekly XP</p>
                    <p className="text-lg font-bold">{comparative.userPerformance.weeklyXp.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Focus Hours</p>
                    <p className="text-lg font-bold">{comparative.userPerformance.weeklyFocusHours}h</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">League Average</p>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Weekly XP</p>
                    <p className="text-lg font-bold">{comparative.cohortAverage.weeklyXp.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Focus Hours</p>
                    <p className="text-lg font-bold">{comparative.cohortAverage.weeklyFocusHours}h</p>
                  </div>
                </div>
              </div>
            </div>

            {comparative.insights.length > 0 && (
              <div className="space-y-2">
                {comparative.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {weeklyReport.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold">💡 Key Recommendations</h2>
            {weeklyReport.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <span className="text-2xl">{i + 1}</span>
                <p className="flex-1 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
