// Camera utilities for real-time face detection and verification
// Uses browser MediaDevices API for webcam access + TensorFlow.js ML models

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

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
  // Enhanced ML detection data
  verificationScore: number; // 0-100% work verification score
  faceLandmarks?: faceLandmarksDetection.Face[];
  distractions: DistractionDetection[];
  headPose?: HeadPose;
}

export interface DistractionDetection {
  object: string; // 'cell phone', 'book', 'laptop', etc.
  confidence: number;
  position: { x: number; y: number; width: number; height: number };
}

export interface HeadPose {
  pitch: number; // Looking up/down (-90 to 90)
  yaw: number;   // Looking left/right (-90 to 90)
  roll: number;  // Head tilt (-90 to 90)
  lookingAtScreen: boolean;
}

class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  
  // ML Models
  private faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private objectDetector: cocoSsd.ObjectDetection | null = null;
  private modelsLoaded = false;

  /**
   * Initialize TensorFlow.js and load ML models
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      console.log('Loading TensorFlow.js models...');
      
      // Set backend
      await tf.setBackend('webgl');
      await tf.ready();

      // Load face landmarks detector (MediaPipe FaceMesh)
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      this.faceDetector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      });

      // Load COCO-SSD object detector
      this.objectDetector = await cocoSsd.load();

      this.modelsLoaded = true;
      console.log('ML models loaded successfully!');
    } catch (error) {
      console.error('Failed to load ML models:', error);
      throw new Error('ML models failed to load. Face and object detection will be unavailable.');
    }
  }

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
   * Detect face landmarks and analyze head pose
   */
  private async detectFaceLandmarks(): Promise<{ faces: faceLandmarksDetection.Face[]; headPose?: HeadPose }> {
    if (!this.faceDetector || !this.videoElement) {
      return { faces: [] };
    }

    const faces = await this.faceDetector.estimateFaces(this.videoElement, { flipHorizontal: false });

    if (faces.length === 0) {
      return { faces: [] };
    }

    // Calculate head pose from first face
    const face = faces[0];
    const headPose = this.calculateHeadPose(face);

    return { faces, headPose };
  }

  /**
   * Calculate head pose from face landmarks
   * Using specific landmarks to estimate pitch, yaw, and roll
   */
  private calculateHeadPose(face: faceLandmarksDetection.Face): HeadPose {
    const keypoints = face.keypoints;
    
    // Key facial landmarks for pose estimation
    const noseTip = keypoints.find(kp => kp.name === 'noseTip');
    const leftEye = keypoints.find(kp => kp.name === 'leftEye');
    const rightEye = keypoints.find(kp => kp.name === 'rightEye');
    const leftEar = keypoints.find(kp => kp.name === 'leftEarTragion');
    const rightEar = keypoints.find(kp => kp.name === 'rightEarTragion');

    if (!noseTip || !leftEye || !rightEye) {
      return { pitch: 0, yaw: 0, roll: 0, lookingAtScreen: true };
    }

    // Calculate yaw (left/right) - based on nose position relative to eyes
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const yaw = ((noseTip.x - eyeCenterX) / 50) * 45; // Normalized to -45 to 45 degrees

    // Calculate pitch (up/down) - based on nose position relative to eyes vertical
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const pitch = ((noseTip.y - eyeCenterY) / 50) * 45;

    // Calculate roll (head tilt) - based on eye line angle
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

    // Determine if looking at screen (threshold: ±30 degrees)
    const lookingAtScreen = Math.abs(yaw) < 30 && Math.abs(pitch) < 30;

    return { pitch, yaw, roll, lookingAtScreen };
  }

  /**
   * Detect objects in frame (phones, books, etc.)
   */
  private async detectObjects(): Promise<DistractionDetection[]> {
    if (!this.objectDetector || !this.videoElement) {
      return [];
    }

    const predictions = await this.objectDetector.detect(this.videoElement);
    
    // Filter for distracting objects
    const distractingObjects = ['cell phone', 'book', 'laptop', 'remote', 'bottle', 'cup'];
    
    return predictions
      .filter(pred => distractingObjects.some(obj => pred.class.toLowerCase().includes(obj)))
      .map(pred => ({
        object: pred.class,
        confidence: pred.score,
        position: {
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3],
        },
      }));
  }

  /**
   * Calculate work verification score (0-100)
   * Based on: face presence, attention, and lack of distractions
   */
  private calculateVerificationScore(
    faceDetected: boolean,
    lookingAtScreen: boolean,
    faceConfidence: number,
    distractions: DistractionDetection[]
  ): number {
    let score = 0;

    // Face presence (40 points)
    if (faceDetected) {
      score += 40 * faceConfidence;
    }

    // Looking at screen (40 points)
    if (lookingAtScreen) {
      score += 40;
    }

    // No distractions (20 points)
    const distractionPenalty = Math.min(distractions.length * 10, 20);
    score += (20 - distractionPenalty);

    return Math.max(0, Math.min(100, Math.round(score)));
  }
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
   * Start continuous ML-powered detection
   */
  async startDetection(callback: (result: DetectionResult) => void, intervalMs: number = 3000): Promise<void> {
    if (this.detectionInterval) {
      this.stopDetection();
    }

    // Load models if not already loaded
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    this.detectionInterval = setInterval(async () => {
      try {
        // Run face detection
        const { faces, headPose } = await this.detectFaceLandmarks();
        
        // Run object detection
        const distractions = await this.detectObjects();

        // Process results
        const faceDetected = faces.length > 0;
        const confidence = faceDetected && faces[0].box ? 0.95 : 0;
        const lookingAtScreen = headPose?.lookingAtScreen ?? false;

        // Calculate verification score
        const verificationScore = this.calculateVerificationScore(
          faceDetected,
          lookingAtScreen,
          confidence,
          distractions
        );

        const result: DetectionResult = {
          faceDetected,
          confidence,
          lookingAtScreen,
          timestamp: Date.now(),
          verificationScore,
          faceLandmarks: faces,
          distractions,
          headPose,
        };

        callback(result);
      } catch (error) {
        console.error('ML Detection error:', error);
        
        // Fallback to motion detection
        this.fallbackMotionDetection(callback);
      }
    }, intervalMs);
  }

  /**
   * Fallback to simple motion detection if ML fails
   */
  private fallbackMotionDetection(callback: (result: DetectionResult) => void): void {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;

    let previousFrame: ImageData | null = null;

    const { hasMotion, currentFrame } = this.detectMotion(canvas, previousFrame);
    previousFrame = currentFrame;

    const result: DetectionResult = {
      faceDetected: hasMotion,
      confidence: hasMotion ? 0.7 : 0.2,
      lookingAtScreen: hasMotion,
      timestamp: Date.now(),
      verificationScore: hasMotion ? 70 : 20,
      distractions: [],
    };

    callback(result);
  }

  /**
   * Simple motion detection (kept as fallback)
   * Returns true if significant motion detected (user is present)
   */

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
   * Clean up resources and unload models
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

    // Dispose TensorFlow models
    if (this.faceDetector) {
      this.faceDetector = null;
    }
    if (this.objectDetector) {
      this.objectDetector = null;
    }
    this.modelsLoaded = false;
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
