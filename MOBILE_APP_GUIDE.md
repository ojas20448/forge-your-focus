# Mobile App Build Guide

## ✅ Setup Complete!

Your FocusForge app is now configured for both **Android** and **iOS**!

---

## 📱 What Was Added

### Capacitor Platforms
- ✅ Android platform (`/android` folder)
- ✅ iOS platform (`/ios` folder)
- ✅ App icons and splash screens created

### Native Plugins Installed
- 📷 **Camera** - Native camera access
- 🔔 **Push Notifications** - Remote notifications
- 📅 **Local Notifications** - Scheduled local alerts
- 🎯 **App** - App lifecycle events
- 🎨 **Splash Screen** - Launch screen
- 📊 **Status Bar** - Status bar control

---

## 🚀 Building the Apps

### For Android

#### Requirements:
- **Android Studio** installed
- **Java JDK** 11 or higher
- Android SDK (API 21+)

#### Steps:

1. **Open Android Studio:**
```bash
npx cap open android
```

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Click "Build" → "Generate Signed Bundle/APK"
   - Or click the green "Run" button to test on emulator/device

3. **Build APK from command line:**
```bash
cd android
./gradlew assembleRelease
# APK will be in: android/app/build/outputs/apk/release/
```

---

### For iOS

#### Requirements:
- **Mac computer** (iOS apps can only be built on macOS)
- **Xcode** 14+ installed
- **Apple Developer Account** ($99/year for app store)
- CocoaPods installed: `sudo gem install cocoapods`

#### Steps:

1. **Open Xcode:**
```bash
npx cap open ios
```

2. **In Xcode:**
   - Select your development team (Apple Developer Account)
   - Select target device or simulator
   - Click the "Play" button to build and run

3. **Build for App Store:**
   - Product → Archive
   - Distribute App → App Store Connect

---

## 🔄 Development Workflow

### When you make changes to your web code:

```bash
# 1. Build the web app
npm run build

# 2. Sync changes to native projects
npx cap sync

# 3. (Optional) Copy changes only
npx cap copy
```

### Live Reload for Development:

```bash
# 1. Start dev server
npm run dev

# 2. Update capacitor.config.ts with your computer's IP:
server: {
  url: 'http://192.168.1.X:8081',
  cleartext: true
}

# 3. Sync and run
npx cap sync
npx cap open android  # or ios
```

---

## 🎨 App Assets

### Icon
- **Location:** `/public/icon.svg`
- **Recommended:** Use [Capacitor Asset Generator](https://github.com/capacitor-community/capacitor-assets)
  ```bash
  npm install -g @capacitor/assets
  npx capacitor-assets generate --iconBackgroundColor '#6366f1'
  ```

### Splash Screen
- **Location:** `/public/splash.svg`
- Generated automatically with icon generation

---

## 📋 App Configuration

### Update App Info:
Edit `capacitor.config.ts`:
```typescript
{
  appId: 'com.focusforge.app',  // Change to your package name
  appName: 'FocusForge',         // Your app name
  webDir: 'dist'
}
```

### Android Permissions:
Edit `android/app/src/main/AndroidManifest.xml` to add:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### iOS Permissions:
Edit `ios/App/App/Info.plist` to add:
```xml
<key>NSCameraUsageDescription</key>
<string>FocusForge needs camera access for proof-of-work verification during focus sessions.</string>
<key>NSNotificationAlwaysUsageDescription</key>
<string>FocusForge sends notifications for task reminders and streak alerts.</string>
```

---

## 📦 Publishing

### Android (Google Play)

1. **Create keystore:**
```bash
keytool -genkey -v -keystore focusforge.keystore -alias focusforge -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing in** `android/app/build.gradle`

3. **Build release APK/AAB:**
```bash
cd android
./gradlew bundleRelease
```

4. **Upload to Google Play Console**

### iOS (App Store)

1. **Create App in App Store Connect**
2. **Archive in Xcode:** Product → Archive
3. **Distribute:** Window → Organizer → Distribute App
4. **Submit for Review**

---

## 🔧 Troubleshooting

### Android build fails:
- Check Java version: `java -version` (need 11+)
- Clean build: `cd android && ./gradlew clean`
- Invalidate Android Studio cache

### iOS build fails:
- Run `pod install` in `/ios/App`
- Update CocoaPods: `sudo gem install cocoapods`
- Clean build: Shift+Cmd+K in Xcode

### Live reload not working:
- Check firewall settings
- Ensure phone and computer on same network
- Use computer's IP address in config

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

---

## 🎉 Next Steps

1. Generate proper app icons from your SVG
2. Test on real devices
3. Configure push notifications backend
4. Set up deep linking
5. Add app store screenshots
6. Prepare app store listings

Your FocusForge app is now ready to go mobile! 🚀📱
