import React, { useState } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { cn } from '@/lib/utils';

export const CameraPermissionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { granted, loading, error, requestPermission } = useCameraPermission();
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    const success = await requestPermission();
    setRequesting(false);
    
    if (success) {
      setTimeout(onClose, 1000); // Close after 1s to show success
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
            granted ? "bg-success/20" : "bg-primary/20"
          )}>
            <Camera className={cn(
              "w-8 h-8",
              granted ? "text-success" : "text-primary"
            )} />
          </div>

          {granted ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Camera Access Granted! ✓
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                ML-powered focus detection is now enabled
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Enable Camera Access
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                FocusForge uses your camera to detect when you're focused using machine learning. 
                This helps track genuine focus sessions.
              </p>

              <div className="w-full bg-secondary/50 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">🔒</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Privacy First</p>
                    <p className="text-xs text-muted-foreground">Processing happens on-device. No images are stored or uploaded.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">🧠</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">ML Detection</p>
                    <p className="text-xs text-muted-foreground">AI detects your face and eyes to verify focus authenticity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Earn More XP</p>
                    <p className="text-xs text-muted-foreground">Verified sessions earn bonus XP for league rankings.</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="w-full flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <Button
                onClick={handleRequest}
                disabled={requesting || loading}
                variant="glow"
                className="w-full"
              >
                {requesting ? 'Requesting...' : 'Grant Camera Access'}
              </Button>

              <button
                onClick={onClose}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
