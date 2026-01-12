# FocusForge - Production Deployment TODO

**Last Updated**: January 12, 2026
**Status**: All features coded, ready for production deployment

---

## 🎯 Overview

All major features are **fully implemented and coded**. The app is currently running with **local Supabase** (127.0.0.1:54321). This TODO focuses on deploying to production Supabase and enabling all coded features.

---

## ✅ What's Already Coded (Not Yet in Production)

### Backend Integration (100% Coded)
- ✅ Full Supabase client setup
- ✅ All hooks with CRUD operations (`useTasks`, `useGoals`, `useProfile`, etc.)
- ✅ Real-time subscriptions for all features
- ✅ Row Level Security policies designed
- ✅ 10+ database tables with migrations
- ✅ Image storage (avatars, vision boards)
- ✅ 4 Edge Functions (task decay, streak checker, league reset, achievements)

### Advanced Features (100% Coded)
- ✅ Anti-cheat challenges (6 types: math, pattern, typing, camera, voice, button)
- ✅ Boss battle system (weekly raids, HP tracking, loot drops, leaderboards)
- ✅ Advanced analytics (cognitive load, heatmaps, burnout detection, PDF reports)
- ✅ League automation (weekly resets, promotions/relegations, season rewards)
- ✅ Social features (friend codes, partnerships, study together, challenges)
- ✅ Manifestation tracking (streak, vision board, affirmation sessions)

### Background Services (100% Coded)
- ✅ Task decay automation (runs every 1 hour)
- ✅ Streak notifications (8am, 8pm, 11pm daily)
- ✅ League reset service (Monday midnight)
- ✅ All services initialized in `main.tsx`

### Mobile Apps (100% Ready)
- ✅ Android APK built (30.7 MB)
- ✅ iOS Xcode project ready
- ✅ Capacitor plugins configured
- ✅ Native permissions setup

---

## 🚀 PHASE 1: Production Supabase Deployment (HIGH PRIORITY)

**Goal**: Switch from local Supabase to production cloud instance

### 1.1 Create Production Supabase Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Create new project: "FocusForge Production"
- [ ] Note project URL and anon key
- [ ] Save service role key (for Edge Functions)

### 1.2 Deploy Database Schema
```bash
# Navigate to project
cd c:\Users\PC\Documents\Code\FocusForge\forge-your-focus

# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

**Migrations to deploy** (all in `supabase/migrations/`):
- [ ] `20260107074201_*.sql` - Initial schema
- [ ] `20260107081149_*.sql` - Additional tables
- [ ] `20260107081938_*.sql` - RLS policies
- [ ] `20260107081948_*.sql` - Functions
- [ ] `20260107082529_*.sql` - Indexes
- [ ] `20260107084932_*.sql` - Storage
- [ ] `20260107150000_add_onboarding_fields.sql` - Onboarding
- [ ] `20260107183412_*.sql` - Latest updates
- [ ] `20260108000000_leaderboard_functions.sql` - Leaderboard
- [ ] `20240116000012_manifestation_features.sql` - Manifestation
- [ ] `20240116000013_fix_raid_rls_recursion.sql` - Raid RLS fix

### 1.3 Deploy Edge Functions
```bash
# Login to Supabase
supabase login

# Deploy all 4 functions
supabase functions deploy task-decay-processor
supabase functions deploy streak-checker
supabase functions deploy weekly-league-reset
supabase functions deploy achievement-processor

# Set environment secrets
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### 1.4 Configure Storage Buckets
- [ ] Create `avatars` bucket (public: true)
- [ ] Create `vision-boards` bucket (public: true)
- [ ] Set RLS policies on buckets (see `BACKEND_SETUP_GUIDE.md`)

### 1.5 Update Environment Variables
```bash
# Edit .env file
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY  # Already set
```

### 1.6 Enable Realtime
- [ ] Go to Supabase Dashboard → Database → Replication
- [ ] Enable replication for all tables:
  - `profiles`, `tasks`, `goals`, `focus_sessions`
  - `raids`, `raid_members`, `achievements`, `user_achievements`
  - `friendships`, `challenges`, `leagues`, `user_league_history`
  - `vision_boards`, `vision_board_items`

### 1.7 Schedule Cron Jobs
Execute in Supabase SQL Editor:
```sql
-- Task decay (every 6 hours)
SELECT cron.schedule(
  'task-decay-processor',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/task-decay-processor',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);

-- Streak checker (daily at midnight)
SELECT cron.schedule(
  'streak-checker',
  '0 0 * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/streak-checker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);

-- League reset (Monday midnight)
SELECT cron.schedule(
  'weekly-league-reset',
  '0 0 * * 1',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/weekly-league-reset',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);

-- Achievement processor (hourly)
SELECT cron.schedule(
  'achievement-processor',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/achievement-processor',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

---

## 🧪 PHASE 2: Testing & Verification (HIGH PRIORITY)

### 2.1 Backend Integration Tests
- [ ] **Authentication Flow**
  - Sign up new user
  - Verify email (if enabled)
  - Login with credentials
  - Check profile created in database
  - Verify onboarding redirect works

- [ ] **Task Management**
  - Create task via AI scheduler
  - Create task via quick add
  - Update task (mark complete)
  - Delete task
  - Verify real-time updates (open in 2 browsers)

- [ ] **Goals System**
  - Create year goal via onboarding
  - Create month/week goals
  - Link task to goal
  - Update goal progress
  - Verify goal-task relationship

- [ ] **Focus Sessions**
  - Start focus session
  - Verify camera access
  - Complete session
  - Check XP awarded
  - Verify session saved to database

- [ ] **Real-time Features**
  - Open app in 2 browsers with same user
  - Create task in browser 1
  - Verify appears in browser 2 instantly
  - Test with goals, profile updates

### 2.2 Advanced Features Tests
- [ ] **Anti-Cheat Challenges**
  - Trigger math challenge (verify difficulty scales)
  - Trigger pattern challenge (memory test)
  - Trigger typing challenge
  - Trigger camera challenge (requires permission)
  - Trigger voice challenge (requires permission)
  - Verify XP bonuses on success

- [ ] **Boss Battles**
  - Manually trigger boss battle (admin)
  - Attack boss with focus session
  - Verify HP decreases correctly
  - Check phase transitions (60%, 30%)
  - Verify leaderboard updates
  - Test loot drops on victory

- [ ] **Analytics Dashboard**
  - Generate productivity heatmap
  - Check cognitive load analysis
  - Test burnout detection
  - Verify task failure predictions
  - Download weekly PDF report

- [ ] **Social Features**
  - Generate friend code
  - Send friend request
  - Accept friend request
  - Create 1-on-1 challenge
  - Start study together session
  - Verify notifications sent

### 2.3 Background Services Tests
- [ ] **Task Decay**
  - Create task scheduled for yesterday
  - Wait 1 hour (or trigger manually)
  - Verify decay_level incremented
  - Check debt_score updated

- [ ] **Streak Notifications**
  - Enable notifications in settings
  - Wait for scheduled time (or trigger manually)
  - Verify notification received
  - Test milestone notifications (7-day, 30-day)

- [ ] **League Reset**
  - Manually trigger reset (testing)
  - Verify weekly_xp reset to 0
  - Check tier promotions/relegations
  - Verify season rewards distributed

### 2.4 Mobile App Tests
- [ ] **Android APK**
  - Build fresh APK: `cd android && ./gradlew assembleDebug`
  - Install on device: `adb install app-debug.apk`
  - Test camera permissions
  - Test push notifications
  - Test offline mode
  - Test haptic feedback

- [ ] **iOS App** (Mac required)
  - Open in Xcode: `npx cap open ios`
  - Build and run on simulator
  - Test all features
  - Archive for TestFlight (optional)

---

## 🎨 PHASE 3: UI/UX Polish (MEDIUM PRIORITY)

### 3.1 Empty States
- [ ] Verify all screens have helpful empty states:
  - Timeline (no tasks)
  - Goals (no goals)
  - Achievements (locked)
  - Raids (no active raids)
  - Contracts (no contracts)
  - Friends (no friends)

### 3.2 Loading States
- [ ] Add skeleton loaders where missing:
  - Timeline loading
  - Goals loading
  - Leaderboard loading
  - Boss battle loading

### 3.3 Error Handling
- [ ] Test offline scenarios
- [ ] Test network errors
- [ ] Test permission denials
- [ ] Verify error boundaries catch crashes

### 3.4 Responsive Design
- [ ] Test on iPhone SE (320px)
- [ ] Test on iPhone 12 (390px)
- [ ] Test on iPhone 14 Pro Max (430px)
- [ ] Test on Android devices
- [ ] Test on tablets

---

## 📱 PHASE 4: Mobile Deployment (MEDIUM PRIORITY)

### 4.1 Android Release
- [ ] Generate release keystore
  ```bash
  keytool -genkey -v -keystore focusforge.keystore -alias focusforge -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Configure signing in `android/app/build.gradle`
- [ ] Build release APK
  ```bash
  cd android
  ./gradlew bundleRelease
  ```
- [ ] Create Google Play Console account
- [ ] Upload AAB to Google Play
- [ ] Fill out store listing
- [ ] Submit for review

### 4.2 iOS Release (Mac Required)
- [ ] Create App Store Connect account ($99/year)
- [ ] Create app in App Store Connect
- [ ] Configure app ID and provisioning
- [ ] Archive in Xcode: Product → Archive
- [ ] Distribute to App Store
- [ ] Fill out store listing
- [ ] Submit for review

### 4.3 App Store Assets
- [ ] Generate app icons (1024x1024)
- [ ] Create screenshots (5-8 per platform)
- [ ] Write app description
- [ ] Create promotional graphics
- [ ] Prepare privacy policy

---

## 🔧 PHASE 5: Production Optimization (LOW PRIORITY)

### 5.1 Performance
- [ ] Enable production build optimizations
- [ ] Lazy load heavy components
- [ ] Optimize images
- [ ] Enable service worker (PWA)
- [ ] Add bundle size analysis

### 5.2 Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add analytics (PostHog, Mixpanel, or Google Analytics)
- [ ] Monitor Supabase usage
- [ ] Set up uptime monitoring
- [ ] Create status page

### 5.3 Security
- [ ] Review all RLS policies
- [ ] Audit API keys (rotate if needed)
- [ ] Enable rate limiting
- [ ] Add CAPTCHA for signup (if needed)
- [ ] Security headers (CSP, HSTS)

### 5.4 Documentation
- [ ] Update README with production URLs
- [ ] Create user guide
- [ ] Create admin guide
- [ ] Document API endpoints
- [ ] Create troubleshooting guide

---

## 🎯 PHASE 6: Feature Enhancements (FUTURE)

### 6.1 ML Computer Vision Upgrade
- [ ] Upgrade from motion detection to full face recognition
- [ ] Add posture detection
- [ ] Implement work verification scoring (0-100%)
- [ ] Add object detection for distractions

### 6.2 Voice Commands
- [ ] Implement Web Speech API
- [ ] Add voice task creation
- [ ] Add voice focus session control
- [ ] Multi-language support

### 6.3 Calendar Integration
- [ ] Google Calendar sync
- [ ] Apple Calendar sync
- [ ] Notion integration
- [ ] Auto-block calendar slots

### 6.4 Advanced Social
- [ ] Video call for study together
- [ ] Team challenges (3v3, 5v5)
- [ ] Guild/clan system
- [ ] Global chat

---

## 📋 Quick Reference Commands

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase
```bash
# Link project
supabase link --project-ref YOUR_REF

# Push migrations
supabase db push

# Deploy function
supabase functions deploy FUNCTION_NAME

# View logs
supabase functions logs FUNCTION_NAME
```

### Mobile
```bash
# Sync to native
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Build Android APK
cd android && ./gradlew assembleDebug
```

---

## ⚠️ Critical Notes

1. **Environment Variables**: Never commit `.env` with real keys
2. **RLS Policies**: Test thoroughly before production
3. **Edge Functions**: Monitor costs (free tier limits)
4. **Backup**: Set up automated database backups
5. **Rate Limits**: Gemini AI has 15/min, 1500/day limits

---

## 📊 Progress Tracking

**Phase 1 (Deployment)**: 0/7 ⬜⬜⬜⬜⬜⬜⬜  
**Phase 2 (Testing)**: 0/4 ⬜⬜⬜⬜  
**Phase 3 (Polish)**: 0/4 ⬜⬜⬜⬜  
**Phase 4 (Mobile)**: 0/3 ⬜⬜⬜  
**Phase 5 (Optimization)**: 0/4 ⬜⬜⬜⬜  
**Phase 6 (Future)**: 0/4 ⬜⬜⬜⬜  

**Overall**: 0% Complete

---

## 🎉 Success Criteria

- [ ] Production Supabase deployed and connected
- [ ] All migrations applied successfully
- [ ] Edge Functions running on schedule
- [ ] Real-time features working
- [ ] Mobile apps built and tested
- [ ] All advanced features functional
- [ ] Zero critical bugs
- [ ] Performance acceptable (< 3s load time)
- [ ] Security audit passed
- [ ] Documentation complete

---

**Next Immediate Steps**:
1. Create production Supabase project
2. Deploy database schema
3. Update `.env` with production credentials
4. Test authentication flow
5. Verify real-time features

**Estimated Time to Production**: 2-3 days (with testing)
