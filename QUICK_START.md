# 🚀 FocusForge - Quick Reference Guide

## 📦 What's Been Implemented

### ✅ Working Right Now (No Setup Required)
- ✨ Energy-based scheduling
- 📊 Debt score tracking
- 🎥 Real camera verification (motion detection)
- 🔔 Browser push notifications

### ✅ Working With Simple Setup
- 🤖 **Gemini AI Scheduling** - Requires API key (free, 5 min setup)

### 📋 Requires Backend Setup
- 🔐 User authentication
- 💾 Data persistence
- 👥 Social features (raids, leagues, friends)
- 📸 Image uploads (avatars, vision boards)

---

## ⚡ Quick Start Guide

### 1. Basic Setup (Required)
```bash
cd forge-your-focus
npm install
npm run dev
```
App runs at: http://localhost:8081

### 2. Enable AI Features (Optional - 5 minutes)
1. Get free API key: https://makersuite.google.com/app/apikey
2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your key:
   ```
   VITE_GEMINI_API_KEY=your_actual_key_here
   ```
4. Restart dev server

### 3. Enable Camera (Automatic)
- Start any verification-required task
- Browser will ask for camera permission
- Allow it - that's it!

### 4. Enable Notifications (In-App)
- Go to Settings tab
- Toggle "Notifications" ON
- Click "Allow" in browser prompt
- You'll get a test notification

---

## 🔧 Common Issues & Fixes

### Camera Not Working
**Problem:** Camera shows error  
**Fix:** 
1. Check browser permissions (Settings → Privacy)
2. Ensure using HTTPS or localhost
3. Try different browser (Chrome/Edge work best)

### AI Not Responding
**Problem:** AI scheduler fails  
**Fix:**
1. Check `.env` file has correct API key
2. Restart dev server: `npm run dev`
3. Check rate limits (15/min, 1500/day on free tier)
4. App will fallback to rule-based scheduling

### Notifications Not Showing
**Problem:** No notifications appear  
**Fix:**
1. Check browser site settings → Notifications → Allowed
2. Ensure not in "Do Not Disturb" mode
3. Some browsers need HTTPS (works on localhost)

---

## 📁 File Structure

```
forge-your-focus/
├── src/
│   ├── components/
│   │   ├── focus/
│   │   │   └── FocusSessionScreen.tsx    # Camera verification
│   │   ├── scheduler/
│   │   │   └── AISchedulerModal.tsx      # Gemini AI
│   │   └── settings/
│   │       └── SettingsScreen.tsx        # Notifications
│   ├── utils/
│   │   ├── cameraManager.ts              # Camera API
│   │   ├── geminiScheduler.ts            # AI API
│   │   └── notificationManager.ts        # Notifications API
│   ├── data/
│   │   └── mockData.ts                   # Test data
│   └── types/
│       └── focusforge.ts                 # TypeScript types
├── .env                                  # Your API keys (create this)
├── .env.example                          # Template
├── BACKEND_SETUP_GUIDE.md               # Backend tutorial
├── BACKEND_TODO.md                      # Integration tasks
├── FEATURES_ROADMAP.md                  # Future features
└── IMPLEMENTATION_SUMMARY.md            # What's done
```

---

## 🎯 Feature Status

| Feature | Status | Setup Required |
|---------|--------|----------------|
| Task Management | ✅ Working | None |
| Timeline View | ✅ Working | None |
| Energy Scheduling | ✅ Working | None |
| Debt Score | ✅ Working | None |
| Camera Verification | ✅ Working | Browser permission |
| Push Notifications | ✅ Working | Browser permission |
| AI Scheduling | ✅ Working | API key (.env) |
| Gamification (XP, Levels) | ✅ Working | None |
| Leagues & Leaderboards | ⏳ Mock data | Backend needed |
| Raids (Boss Battles) | ⏳ Mock data | Backend needed |
| User Authentication | ⏳ Not started | Backend needed |
| Data Persistence | ⏳ Not started | Backend needed |
| Social Features | ⏳ Not started | Backend needed |

---

## 🎮 How to Use

### Create Tasks with AI
1. Click **+** button (bottom right)
2. Type natural language: "Study physics 2 hours and workout 30 min"
3. AI generates smart schedule
4. Select tasks → Add to Schedule

### Start Focus Session
1. Click any pending task in timeline
2. Camera activates (allow permission)
3. Green border = verified
4. Red border = not detected (get back to work!)
5. Earn XP for verified time

### Check Your Progress
- **Home Tab:** Today's timeline and stats
- **Stats Tab:** Detailed analytics and debt score
- **Goals Tab:** Long-term goal tracking
- **Raids Tab:** Team challenges (mock data currently)
- **Settings Tab:** Configure energy profile, notifications

---

## 🔐 Environment Variables

```bash
# AI Features (Optional)
VITE_GEMINI_API_KEY=your_key        # From makersuite.google.com

# Backend (Not Yet Implemented)
VITE_SUPABASE_URL=...               # When you set up Supabase
VITE_SUPABASE_ANON_KEY=...          # Follow BACKEND_SETUP_GUIDE.md
```

---

## 📚 Documentation

### For Users
- **This File** - Quick start and troubleshooting
- `FEATURES_ROADMAP.md` - What's planned next

### For Developers
- `IMPLEMENTATION_SUMMARY.md` - Technical details of what's built
- `BACKEND_SETUP_GUIDE.md` - Complete Supabase setup (2-3 hours)
- `BACKEND_TODO.md` - Tasks for backend integration

### API Documentation
- Camera: `src/utils/cameraManager.ts` (TypeDoc comments)
- AI: `src/utils/geminiScheduler.ts` (TypeDoc comments)
- Notifications: `src/utils/notificationManager.ts` (TypeDoc comments)

---

## 🎨 Customization

### Change Energy Profile
Settings → Energy Profile → Pick one:
- ☀️ Morning Lark (Peak: 6 AM - 12 PM)
- ☕ Balanced (Peak: 9 AM - 5 PM)
- 🌙 Night Owl (Peak: 6 PM - 12 AM)

AI will schedule tasks during your peak hours!

### Theme
Settings → Dark Mode toggle
(More themes coming in future updates)

---

## 🐛 Known Issues

1. **Mock Data:** Most data is simulated (backend in progress)
2. **Motion Detection:** Basic algorithm, not full ML face recognition
3. **Offline:** Requires internet for AI features
4. **Mobile:** Some features work better on desktop

---

## 🤝 Contributing

See `BACKEND_TODO.md` for tasks that need implementation.

Priority areas:
1. Authentication UI
2. Supabase integration
3. Social features
4. Advanced ML for camera

---

## 📞 Support

Having issues?
1. Check this guide first
2. Read `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check browser console for errors (F12)
4. Verify API keys are set correctly

---

## 🎉 Quick Wins

Try these to see features in action:

1. **AI Scheduling:**
   - Add API key → Test with: "Study math 2 hours"
   
2. **Camera:**
   - Start "Physics" task → Move away from screen
   
3. **Debt Score:**
   - Stats tab → See your task debt breakdown
   
4. **Notifications:**
   - Enable in settings → Get instant test notification

---

## 🔮 Coming Soon

**This Month:**
- Backend authentication
- Real data persistence
- Social features

**Next Month:**
- Advanced ML face recognition
- Voice commands
- Mobile app (PWA)

See `FEATURES_ROADMAP.md` for complete roadmap.

---

**Last Updated:** January 6, 2026  
**Version:** 1.0.0  
**Status:** Frontend Complete, Backend Ready for Integration
