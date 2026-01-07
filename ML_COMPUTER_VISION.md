# ML Computer Vision - Advanced Camera Verification

## 🚀 Overview

FocusForge now includes **advanced ML-powered computer vision** for real-time work verification during focus sessions. This system goes beyond simple motion detection to provide intelligent, accurate verification of user presence and focus.

## ✨ Features Implemented

### 1. **Face Detection with MediaPipe FaceMesh**
- Real-time face landmark detection (478 landmarks)
- High accuracy face presence detection
- Confidence scoring for face detection
- Handles varying lighting conditions

### 2. **Head Pose Estimation**
- **Pitch** tracking (looking up/down)
- **Yaw** tracking (looking left/right)
- **Roll** tracking (head tilt)
- Determines if user is actually looking at the screen
- Threshold: ±30 degrees for "looking at screen"

### 3. **Object Detection (COCO-SSD)**
Detects common distractions in the camera frame:
- 📱 Cell phones
- 📚 Books
- 💻 Other laptops
- 🥤 Bottles/cups
- 📺 TVs and screens

### 4. **Work Verification Score (0-100%)**

The system calculates a real-time verification score based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Face Presence | 40% | Is a face detected in frame? |
| Attention | 40% | Is the user looking at the screen? |
| No Distractions | 20% | Are there distracting objects visible? |

**Score Interpretation:**
- 🟢 **80-100%**: Excellent - Fully verified, working
- 🟡 **60-79%**: Good - Minor issues, still acceptable
- 🔴 **0-59%**: Poor - Verification failed, needs attention

## 🏗️ Architecture

### Core Components

#### 1. **cameraManager.ts** (Enhanced)
```typescript
// New ML capabilities
- loadModels(): Load TensorFlow.js models
- detectFaceLandmarks(): Face detection with landmarks
- calculateHeadPose(): Estimate head orientation
- detectObjects(): Find distracting objects
- calculateVerificationScore(): Compute 0-100% score
```

**Models Used:**
- **MediaPipe FaceMesh** (via TensorFlow.js)
  - Runtime: `tfjs` (WebGL backend)
  - Max faces: 1
  - Refined landmarks enabled
  
- **COCO-SSD** (via TensorFlow.js)
  - Pre-trained on 80 object classes
  - Optimized for real-time inference

#### 2. **MLVerificationPanel.tsx** (New Component)
Beautiful UI panel displaying:
- Large verification score with color coding
- Progress bar visualization
- Face detection status
- Head pose information (attention tracking)
- List of detected distractions with icons
- Real-time updates every 3 seconds

#### 3. **CameraStatusBubble.tsx** (Enhanced)
Floating status indicator showing:
- Verification score badge
- Color-coded status (green/yellow/red)
- Brain icon for ML processing
- Quick status text

## 📊 Detection Results Interface

```typescript
interface DetectionResult {
  // Basic detection (legacy)
  faceDetected: boolean;
  confidence: number;
  lookingAtScreen: boolean;
  timestamp: number;
  
  // ML enhancements
  verificationScore: number; // 0-100%
  faceLandmarks?: Face[];
  distractions: DistractionDetection[];
  headPose?: {
    pitch: number;  // -90 to 90
    yaw: number;    // -90 to 90
    roll: number;   // -90 to 90
    lookingAtScreen: boolean;
  };
}
```

## 🎯 Usage in Focus Sessions

### Automatic Detection
When a verified task is started:
1. Camera initializes
2. ML models load (1-2 seconds)
3. Detection starts every 3 seconds
4. Verification score updates in real-time
5. User receives visual feedback

### Verification Thresholds
- **Verified**: Score ≥ 60%
- **Warning**: Score < 50% (increments warning counter)
- **XP Earning**: Only when verified

### UI Feedback
- **Camera border color**: 
  - Green: Score ≥ 80%
  - Yellow: Score 60-79%
  - Red: Score < 60%
- **Score display**: Large percentage in ML panel
- **Attention indicator**: Shows if looking at screen
- **Distraction alerts**: Lists detected objects

## 🔧 Technical Details

### Model Loading
```typescript
// Initialization
await tf.setBackend('webgl');
await tf.ready();

// Face detector
const faceDetector = await faceLandmarksDetection.createDetector(
  faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
  { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
);

// Object detector
const objectDetector = await cocoSsd.load();
```

### Performance
- **Detection interval**: 3 seconds (configurable)
- **Model loading time**: 1-3 seconds (first time only)
- **Inference time**: 50-200ms per frame
- **Resource usage**: WebGL acceleration (GPU)

### Fallback Mechanism
If ML models fail to load:
- Falls back to simple motion detection
- Still provides basic verification
- Score calculated heuristically (~70% for motion)

## 🎨 UI Components

### Main Panel Location
- Appears below camera preview in FocusSessionScreen
- Shows when `task.verification_required === true`
- Updates every 3 seconds with new detection results

### Status Bubble
- Fixed position: top-right corner
- Shows verification score when ML is active
- Click to expand (future feature)

## 📦 Dependencies

Added packages:
```json
{
  "@tensorflow/tfjs": "^4.x",
  "@tensorflow/tfjs-backend-webgl": "^4.x",
  "@tensorflow-models/face-landmarks-detection": "^1.x",
  "@tensorflow-models/coco-ssd": "^2.x"
}
```

Total size: ~71 packages (~15MB)

## 🚀 Performance Optimizations

### Already Implemented
1. Single face detection (maxFaces: 1)
2. WebGL backend for GPU acceleration
3. Detection interval spacing (3s)
4. Async model loading
5. Cleanup on component unmount

### Future Optimizations
- [ ] Model caching in IndexedDB
- [ ] Web Workers for off-main-thread inference
- [ ] Adaptive detection intervals based on score
- [ ] Quantized models for faster inference

## 🐛 Error Handling

### Camera Errors
- Permission denied → Clear error message
- No camera found → Fallback message
- Stream error → Automatic retry

### ML Model Errors
- Load failure → Fallback to motion detection
- Inference error → Skip frame, continue
- Browser incompatibility → Graceful degradation

## 🔮 Future Enhancements

### High Priority
- [ ] **Posture detection**: Slouching vs sitting upright
- [ ] **Activity recognition**: Typing vs idle
- [ ] **Eye tracking**: Gaze direction estimation
- [ ] **Fatigue detection**: Yawning, eye closures

### Medium Priority
- [ ] **Multi-person detection**: Team focus sessions
- [ ] **Background analysis**: Work environment quality
- [ ] **Emotion recognition**: Stress/frustration detection
- [ ] **Custom object training**: User-specific distractions

### Low Priority
- [ ] **Privacy mode**: On-device only, no cloud
- [ ] **Snapshot galleries**: Review session footage
- [ ] **Analytics dashboard**: Verification trends
- [ ] **Challenge generation**: Based on detection patterns

## 🔐 Privacy & Security

### Current Implementation
- ✅ All processing happens **on-device**
- ✅ No video/images uploaded to servers
- ✅ No persistent storage of camera data
- ✅ Camera stream stops when session ends
- ✅ User must grant camera permission

### Best Practices
- Models run in browser (TensorFlow.js)
- No external API calls for inference
- Detection results stored temporarily in memory
- Snapshots optional (not implemented yet)

## 📈 Testing & Validation

### Manual Testing Checklist
- [x] Face detection works in various lighting
- [x] Head pose tracking accurate (±30°)
- [x] Objects detected correctly (phone, book, etc.)
- [x] Score calculation matches formula
- [x] UI updates in real-time
- [x] Fallback works if ML fails
- [x] Cleanup prevents memory leaks

### Known Limitations
- Requires modern browser with WebGL
- Performance varies by device GPU
- Lighting affects accuracy
- Face must be reasonably front-facing
- Small objects may not be detected

## 🎓 Learning Resources

### TensorFlow.js
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)
- [Face Landmarks Detection](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection)
- [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)

### Computer Vision
- MediaPipe FaceMesh: [Google MediaPipe](https://google.github.io/mediapipe/solutions/face_mesh.html)
- Object Detection: [COCO Dataset](https://cocodataset.org/)
- Head Pose Estimation: [Research Papers](https://arxiv.org/search/?query=head+pose+estimation)

## 📝 Summary

The ML Computer Vision system transforms FocusForge's verification from simple motion detection to a sophisticated, multi-factor analysis system. Users now receive **intelligent, real-time feedback** about their focus quality, making the app a powerful tool for maintaining productivity and combating distractions.

**Key Benefits:**
- 🎯 Accurate verification (not fooled by movement)
- 🧠 Intelligent scoring (multi-factor analysis)
- 👁️ Attention tracking (knows when you look away)
- 🚫 Distraction detection (sees your phone!)
- 📊 Clear feedback (0-100% score)
- 🔒 Private & secure (on-device only)

Ready to build? The system is fully functional and tested! 🚀
