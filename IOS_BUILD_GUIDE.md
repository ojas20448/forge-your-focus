# iOS Build & Testing Guide

## Prerequisites

### Required
- **Mac computer** (macOS 11+ recommended)
- **Xcode** (14.0+ from App Store)
- **Apple ID** (free account works for testing)
- **iPhone** with iOS 13+ (for testing)

### Optional
- Apple Developer Program ($99/year for App Store distribution)

---

## Step-by-Step Instructions

### 1. Transfer Project to Mac

**Option A: Git (Recommended)**
```bash
# On Windows - commit and push
git add .
git commit -m "iOS build ready"
git push

# On Mac - clone/pull
git clone [your-repo]
cd forge-your-focus
```

**Option B: USB/Cloud Drive**
- Copy entire `forge-your-focus` folder to Mac

### 2. Setup on Mac

```bash
# Install dependencies
npm install

# Sync iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 3. Configure Xcode

#### A. Set Development Team
1. Select **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Check "Automatically manage signing"
4. Select your **Team** (Apple ID)

#### B. Update Bundle Identifier (if needed)
- Change to unique ID: `com.yourname.focusforge`
- Must be unique across App Store

#### C. Set Deployment Target
- Minimum: iOS 13.0
- Recommended: iOS 14.0+

### 4. Connect iPhone

1. **Connect iPhone** to Mac via USB cable
2. **Trust Computer** on iPhone (popup appears)
3. **Enable Developer Mode** (iOS 16+):
   - Settings → Privacy & Security → Developer Mode → ON
   - Restart iPhone

### 5. Run on iPhone

1. Select your **iPhone** from device dropdown (top bar)
2. Click **Run** button (▶️) or press **⌘ + R**
3. Wait for build (2-5 minutes first time)
4. App installs automatically

#### First Launch
- **"Untrusted Developer"** warning may appear
- Fix: Settings → General → VPN & Device Management
- Trust your developer account

---

## Common Issues & Fixes

### Issue: "No accounts with App Store Connect access"
**Fix:** Add Apple ID in Xcode → Settings → Accounts

### Issue: "Provisioning profile doesn't match"
**Fix:** 
1. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
2. Clean build: ⌘ + Shift + K
3. Rebuild

### Issue: "Signing for 'App' requires a development team"
**Fix:** Select a team in Signing & Capabilities

### Issue: SQLite plugin error
**Fix:** 
```bash
cd ios/App
pod install
```

### Issue: Camera permissions not working
**Fix:** Add to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>FocusForge needs camera access for work verification</string>
```

---

## Testing Features on iOS

### ML Computer Vision
- Grant camera permission when prompted
- Works best in good lighting
- Face detection may be slower on older iPhones (A12+ recommended)

### Offline Mode
- Toggle Airplane mode to test offline functionality
- Verify tasks save locally
- Verify sync when back online

### Haptic Feedback
- All iPhones since 6S support haptics
- More advanced on iPhone 7+ (Taptic Engine)
- Test all haptic events

### Social Features
- Requires internet connection
- Test leaderboards, challenges, raids

---

## Building for Distribution

### TestFlight (Beta Testing)

1. **Archive the app:**
   - Product → Archive
   - Wait for archive to complete

2. **Upload to App Store Connect:**
   - Window → Organizer
   - Select archive → Distribute App
   - Choose "App Store Connect"
   - Follow prompts

3. **Setup TestFlight:**
   - Login to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your app
   - TestFlight → Internal Testing
   - Add testers by email

4. **Invite testers:**
   - Testers receive email invite
   - Install TestFlight app from App Store
   - Accept invite and install

### App Store (Production)

1. **Complete App Store listing:**
   - Screenshots (required)
   - Description
   - Keywords
   - Privacy policy

2. **Submit for review:**
   - Upload via Xcode (as above)
   - Submit from App Store Connect
   - Review takes 24-48 hours

---

## Performance Optimization

### Reduce App Size
```bash
# Enable bitcode (automatic optimization)
# Xcode → Build Settings → Enable Bitcode → YES
```

### Improve Launch Time
- Lazy load TensorFlow.js models
- Defer non-critical initializations

### Battery Optimization
- Reduce ML inference frequency if needed
- Use background tasks for sync

---

## Cloud Build Services (No Mac Needed)

### Ionic Appflow
```bash
npm install -g @ionic/cli
ionic login
ionic link
ionic deploy build ios
```
- Free tier available
- Builds in cloud
- Downloads IPA file

### Codemagic
- Free for open source
- YAML configuration
- Automatic builds

### Bitrise
- Free tier: 45 min/month
- Pre-configured for Capacitor
- Can deploy to TestFlight

---

## Quick Commands Reference

```bash
# Sync iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Clean iOS build
cd ios/App
pod deintegrate
pod install

# Update Capacitor plugins
npm install @capacitor/[plugin]@latest
npx cap sync ios

# Run on device
npx cap run ios --target="YOUR_DEVICE_NAME"

# Build for production
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive
```

---

## Next Steps After Successful Build

1. ✅ Test all features on physical device
2. ✅ Verify ML camera works smoothly
3. ✅ Test offline mode extensively
4. ✅ Check haptic feedback on all interactions
5. ✅ Invite beta testers via TestFlight
6. ✅ Collect feedback
7. ✅ Iterate and improve
8. ✅ Submit to App Store

---

## Need Help?

- Capacitor iOS Docs: https://capacitorjs.com/docs/ios
- Xcode Help: https://developer.apple.com/xcode/
- Ionic Forum: https://forum.ionicframework.com/

Good luck with your iOS build! 🚀📱
