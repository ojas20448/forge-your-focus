# Backend Implementation TODO

This file tracks remaining backend integration tasks after completing the setup guide.

## ✅ Completed (Frontend Features)

- [x] Real camera access with WebRTC for verification
- [x] Gemini AI integration for smart scheduling
- [x] Browser push notifications system
- [x] Energy-based scheduling
- [x] Debt score tracking
- [x] Complete Supabase schema design

---

## 🔨 TODO: Backend Integration

### HIGH PRIORITY - Data Persistence

- [ ] **User Authentication UI**
  - [ ] Login/Signup screens
  - [ ] Email verification flow
  - [ ] Password reset
  - [ ] OAuth providers (Google, GitHub)
  - [ ] Session management

- [ ] **Task CRUD Operations**
  - [ ] Replace mockData with Supabase queries
  - [ ] Create task API hooks (useCreateTask, useUpdateTask, etc.)
  - [ ] Real-time task updates via subscriptions
  - [ ] Task decay automation (Edge Function)

- [ ] **Goal Management**
  - [ ] Goal creation and editing
  - [ ] Goal-task linking
  - [ ] Progress calculation
  - [ ] Milestone tracking

- [ ] **User Profile Integration**
  - [ ] Profile creation on signup
  - [ ] XP and level updates
  - [ ] Streak calculation and persistence
  - [ ] Debt score real-time updates

### MEDIUM PRIORITY - Social Features

- [ ] **Leagues & Leaderboards**
  - [ ] Real-time leaderboard queries
  - [ ] League tier management
  - [ ] Weekly resets
  - [ ] Rank calculation

- [ ] **Raid System**
  - [ ] Raid creation (admin)
  - [ ] Join raid functionality
  - [ ] Real-time raid progress
  - [ ] Contribution tracking
  - [ ] Reward distribution

- [ ] **Friend System**
  - [ ] Friend requests
  - [ ] Friend code generation
  - [ ] Friend list
  - [ ] Challenge creation
  - [ ] Activity feed

- [ ] **Image Storage**
  - [ ] Avatar upload
  - [ ] Vision board image management
  - [ ] Image optimization
  - [ ] CDN integration

### LOW PRIORITY - Advanced Features

- [ ] **Analytics**
  - [ ] Focus session tracking
  - [ ] Productivity patterns
  - [ ] Export data
  - [ ] Weekly reports

- [ ] **Notifications Backend**
  - [ ] Schedule task reminders
  - [ ] Raid alerts
  - [ ] Streak warnings
  - [ ] Achievement unlocks

- [ ] **Edge Functions**
  - [ ] Task decay cron job
  - [ ] Daily streak check
  - [ ] Weekly league reset
  - [ ] Achievement processor
  - [ ] Debt score calculator

---

## 📝 Implementation Steps

### Phase 1: Authentication (Week 1)
1. Install Supabase client
2. Create auth context
3. Build login/signup UI
4. Implement protected routes
5. Add session persistence

### Phase 2: Core Data (Week 2)
1. Create API hooks
2. Replace mock data with real queries
3. Implement real-time subscriptions
4. Add loading/error states
5. Optimize queries

### Phase 3: Social (Week 3)
1. Implement leaderboards
2. Build raid system
3. Add friend features
4. Test multiplayer flow

### Phase 4: Storage & Advanced (Week 4)
1. Implement image upload
2. Create Edge Functions
3. Set up cron jobs
4. Add analytics
5. Performance optimization

---

## 🚀 Quick Commands

### Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Generate Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT > src/types/database.ts
```

### Run Migrations
```bash
npx supabase db push
```

### Deploy Edge Functions
```bash
npx supabase functions deploy function-name
```

---

## 📚 Reference Files

- `BACKEND_SETUP_GUIDE.md` - Complete setup instructions
- `src/lib/supabase.ts` - Supabase client (to be created)
- `src/hooks/useAuth.ts` - Auth hook (to be created)
- `src/hooks/useTask.ts` - Task CRUD hooks (to be created)

---

## ⚠️ Important Notes

1. **Never commit** `.env` file with real API keys
2. **Always use** Row Level Security policies
3. **Test** RLS policies thoroughly before production
4. **Monitor** Edge Function costs (free tier limits)
5. **Backup** database regularly
6. **Use** TypeScript types from generated schema
