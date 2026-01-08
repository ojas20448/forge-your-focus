import { useState, useEffect, useCallback } from 'react';
import { analyticsEngine, WeeklyReport, BurnoutIndicators, ComparativeAnalysis, TaskPrediction } from '@/utils/analyticsEngine';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useAnalytics = () => {
  const { user } = useAuth();
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState<BurnoutIndicators | null>(null);
  const [comparative, setComparative] = useState<ComparativeAnalysis | null>(null);
  const [predictions, setPredictions] = useState<TaskPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyReport = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const report = await analyticsEngine.generateWeeklyReport(user.id);
      setWeeklyReport(report);
      setBurnoutAnalysis(report.burnoutAnalysis);
      setComparative(report.comparativeAnalysis);
      setPredictions(report.predictions);
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchBurnoutAnalysis = useCallback(async () => {
    if (!user) return;

    try {
      const analysis = await analyticsEngine.detectBurnout(user.id);
      setBurnoutAnalysis(analysis);
      
      if (analysis.riskLevel === 'critical') {
        toast.error('CRITICAL: High burnout risk detected!', {
          description: 'Please take immediate rest',
          duration: 10000,
        });
      } else if (analysis.riskLevel === 'high') {
        toast.warning('Warning: Elevated burnout risk', {
          description: 'Consider taking a break',
        });
      }
    } catch (error) {
      console.error('Failed to fetch burnout analysis:', error);
    }
  }, [user]);

  const predictTaskRisk = useCallback(async (taskId: string): Promise<TaskPrediction | null> => {
    if (!user) return null;

    try {
      const prediction = await analyticsEngine.predictTaskFailure(user.id, taskId);
      
      if (prediction.failureProbability > 0.7) {
        toast.warning('High failure risk for this task', {
          description: prediction.riskFactors[0],
        });
      }
      
      return prediction;
    } catch (error) {
      console.error('Failed to predict task risk:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    fetchWeeklyReport();
    fetchBurnoutAnalysis();
  }, [fetchWeeklyReport, fetchBurnoutAnalysis]);

  return {
    weeklyReport,
    burnoutAnalysis,
    comparative,
    predictions,
    loading,
    fetchWeeklyReport,
    fetchBurnoutAnalysis,
    predictTaskRisk,
  };
};
