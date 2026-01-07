import React from 'react';
import { Eye, Brain, AlertTriangle, Smartphone, BookOpen, Monitor, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetectionResult } from '@/utils/cameraManager';

interface MLVerificationPanelProps {
  detectionResult: DetectionResult | null;
  showDetails?: boolean;
}

export const MLVerificationPanel: React.FC<MLVerificationPanelProps> = ({
  detectionResult,
  showDetails = true,
}) => {
  if (!detectionResult) {
    return (
      <div className="bg-secondary/30 backdrop-blur-sm rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Initializing ML detection...</span>
        </div>
      </div>
    );
  }

  const { verificationScore, faceDetected, lookingAtScreen, distractions, headPose } = detectionResult;

  // Score color coding
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-accent';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/20 border-success/30';
    if (score >= 60) return 'bg-warning/20 border-warning/30';
    return 'bg-accent/20 border-accent/30';
  };

  // Distraction icons mapping
  const getDistractionIcon = (object: string) => {
    if (object.toLowerCase().includes('phone')) return <Smartphone className="w-4 h-4" />;
    if (object.toLowerCase().includes('book')) return <BookOpen className="w-4 h-4" />;
    if (object.toLowerCase().includes('laptop')) return <Monitor className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      {/* Verification Score - Large Display */}
      <div className={cn(
        "rounded-xl p-4 border-2 transition-all duration-300",
        getScoreBgColor(verificationScore)
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className={cn("w-5 h-5", getScoreColor(verificationScore))} />
            <span className="text-sm font-medium text-foreground">Work Verification</span>
          </div>
          <div className={cn(
            "text-3xl font-bold font-mono-time",
            getScoreColor(verificationScore)
          )}>
            {verificationScore}%
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              verificationScore >= 80 ? "bg-success" :
              verificationScore >= 60 ? "bg-warning" : "bg-accent"
            )}
            style={{ width: `${verificationScore}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <>
          {/* Face Detection Status */}
          <div className="bg-secondary/30 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Face Detection</span>
              {faceDetected ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-accent" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Eye className={cn(
                "w-5 h-5",
                faceDetected ? "text-success" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium",
                faceDetected ? "text-foreground" : "text-muted-foreground"
              )}>
                {faceDetected ? "Face detected" : "No face detected"}
              </span>
            </div>
            
            {/* Head pose info */}
            {headPose && (
              <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Attention:</span>
                  <span className={cn(
                    "font-medium",
                    lookingAtScreen ? "text-success" : "text-accent"
                  )}>
                    {lookingAtScreen ? "Looking at screen ✓" : "Looking away"}
                  </span>
                </div>
                {!lookingAtScreen && (
                  <div className="text-xs text-muted-foreground">
                    Head: {Math.abs(headPose.yaw) > 30 ? '← →' : '↑ ↓'} 
                    {` (${Math.round(Math.max(Math.abs(headPose.yaw), Math.abs(headPose.pitch)))}°)`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Distractions */}
          {distractions && distractions.length > 0 && (
            <div className="bg-accent/10 backdrop-blur-sm rounded-lg p-3 border border-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <span className="text-xs text-accent uppercase tracking-wide font-semibold">
                  Distractions Detected
                </span>
              </div>
              <div className="space-y-1.5">
                {distractions.map((distraction, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-accent">
                      {getDistractionIcon(distraction.object)}
                      <span className="capitalize">{distraction.object}</span>
                    </div>
                    <span className="text-xs text-accent/70">
                      {Math.round(distraction.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No distractions message */}
          {distractions && distractions.length === 0 && verificationScore >= 80 && (
            <div className="bg-success/10 backdrop-blur-sm rounded-lg p-3 border border-success/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">
                  No distractions detected
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
