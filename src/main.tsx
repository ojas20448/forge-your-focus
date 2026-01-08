import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Start background services
import { taskDecayService } from './utils/taskDecayService';
import { streakNotifications } from './utils/streakNotifications';
import { leagueResetService } from './utils/leagueResetService';

// Initialize services
taskDecayService.start();
streakNotifications.initialize();
leagueResetService.start();

console.log('✅ Background services started:', {
  taskDecay: 'Running (1h intervals)',
  streakNotifications: 'Active (8am, 8pm, 11pm)',
  leagueReset: 'Scheduled (Monday midnight)'
});

createRoot(document.getElementById("root")!).render(<App />);
