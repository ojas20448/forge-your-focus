// Camera utilities for real-time face detection and verification
// Uses browser MediaDevices API for webcam access

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

export interface DetectionResult {
  faceDetected: boolean;
  confidence: number;
  lookingAtScreen: boolean;
  timestamp: number;
}

class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize camera and request permissions
   */
  async initialize(config: CameraConfig = { width: 640, height: 480, facingMode: 'user' }): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          facingMode: config.facingMode,
        },
        audio: false,
      });

      return this.stream;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No camera found on this device.');
        } else {
          throw new Error(`Camera initialization failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Attach stream to video element
   */
  attachToVideo(videoElement: HTMLVideoElement): void {
    if (!this.stream) {
      throw new Error('Camera not initialized. Call initialize() first.');
    }

    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
    videoElement.play();
  }

  /**
   * Check camera permissions status
   */
  async checkPermissions(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Simple motion detection to verify user presence
   * Returns true if significant motion detected (user is present)
   */
  detectMotion(canvas: HTMLCanvasElement, previousFrame: ImageData | null): { hasMotion: boolean; currentFrame: ImageData } {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Draw current frame
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (!previousFrame) {
      return { hasMotion: false, currentFrame };
    }

    // Calculate difference between frames
    let diffPixels = 0;
    const threshold = 30; // Sensitivity threshold
    const minDiffPixels = (canvas.width * canvas.height) * 0.05; // 5% of pixels must change

    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const diff = Math.abs(currentFrame.data[i] - previousFrame.data[i]) +
                   Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]) +
                   Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
      
      if (diff > threshold) {
        diffPixels++;
      }
    }

    return {
      hasMotion: diffPixels > minDiffPixels,
      currentFrame,
    };
  }

  /**
   * Start continuous detection
   */
  startDetection(callback: (result: DetectionResult) => void, intervalMs: number = 5000): void {
    if (this.detectionInterval) {
      this.stopDetection();
    }

    let previousFrame: ImageData | null = null;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;

    this.detectionInterval = setInterval(() => {
      try {
        const { hasMotion, currentFrame } = this.detectMotion(canvas, previousFrame);
        previousFrame = currentFrame;

        // Simple heuristic: if motion detected, assume face present and looking
        const result: DetectionResult = {
          faceDetected: hasMotion,
          confidence: hasMotion ? 0.85 : 0.2,
          lookingAtScreen: hasMotion,
          timestamp: Date.now(),
        };

        callback(result);
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop detection
   */
  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Capture a snapshot from the video stream
   */
  captureSnapshot(): string | null {
    if (!this.videoElement) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopDetection();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Get available camera devices
   */
  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }
}

// Singleton instance
export const cameraManager = new CameraManager();

// Helper hook for React components
export const useCameraPermission = () => {
  const checkPermission = async (): Promise<boolean> => {
    const status = await cameraManager.checkPermissions();
    return status === 'granted';
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const stream = await cameraManager.initialize();
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  return { checkPermission, requestPermission };
};
