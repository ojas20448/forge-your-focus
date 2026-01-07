// Sync manager for bi-directional sync between local SQLite and Supabase
// Handles conflict resolution and network state management

import { Network } from '@capacitor/network';
import { offlineStorage } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  isSyncing: boolean;
}

export type ConflictResolutionStrategy = 'local-wins' | 'remote-wins' | 'newest-wins';

class SyncManager {
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSyncTime: null,
    pendingChanges: 0,
    isSyncing: false,
  };

  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictStrategy: ConflictResolutionStrategy = 'newest-wins';

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    // Initialize offline storage
    await offlineStorage.initialize();

    // Setup network listener
    Network.addListener('networkStatusChange', (status) => {
      this.syncStatus.isOnline = status.connected;
      this.notifyListeners();

      // Auto-sync when coming back online
      if (status.connected) {
        this.sync();
      }
    });

    // Get initial network status
    const status = await Network.getStatus();
    this.syncStatus.isOnline = status.connected;

    // Start periodic sync (every 5 minutes when online)
    this.startPeriodicSync(5 * 60 * 1000);

    // Get pending changes count
    await this.updatePendingCount();
  }

  /**
   * Perform bi-directional sync
   */
  async sync(force: boolean = false): Promise<void> {
    if (this.syncStatus.isSyncing && !force) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.syncStatus.isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    this.syncStatus.isSyncing = true;
    this.notifyListeners();

    try {
      // 1. Push local changes to Supabase
      await this.pushLocalChanges();

      // 2. Pull remote changes from Supabase
      await this.pullRemoteChanges();

      // 3. Update sync status
      this.syncStatus.lastSyncTime = Date.now();
      await this.updatePendingCount();

      // 4. Clean up old synced items
      await offlineStorage.clearOldSyncedItems();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Push local changes to Supabase
   */
  private async pushLocalChanges(): Promise<void> {
    const pendingItems = await offlineStorage.getPendingSyncItems();

    for (const item of pendingItems) {
      try {
        switch (item.table) {
          case 'tasks':
            await this.syncTask(item);
            break;
          case 'goals':
            await this.syncGoal(item);
            break;
          case 'focus_sessions':
            await this.syncFocusSession(item);
            break;
        }

        // Mark as synced
        await offlineStorage.markSynced(item.id);
      } catch (error) {
        console.error(`Failed to sync ${item.table}:`, error);
        await offlineStorage.incrementRetry(
          item.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  /**
   * Sync task to Supabase
   */
  private async syncTask(item: any): Promise<void> {
    const { data, action } = item;

    if (action === 'create' || action === 'update') {
      // Check for conflicts
      const { data: existing } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('id', data.id)
        .single();

      if (existing) {
        const remoteUpdated = new Date(existing.updated_at).getTime();
        const localUpdated = new Date(data.updated_at).getTime();

        // Handle conflict
        if (this.shouldUseLocal(localUpdated, remoteUpdated)) {
          await supabase.from('tasks').upsert(data);
        } else {
          // Remote wins - pull the remote version
          await this.pullTaskFromRemote(data.id);
        }
      } else {
        // No conflict - insert
        await supabase.from('tasks').insert(data);
      }
    } else if (action === 'delete') {
      await supabase.from('tasks').delete().eq('id', data.id);
    }
  }

  /**
   * Sync goal to Supabase
   */
  private async syncGoal(item: any): Promise<void> {
    const { data, action } = item;

    if (action === 'create' || action === 'update') {
      const { data: existing } = await supabase
        .from('goals')
        .select('updated_at')
        .eq('id', data.id)
        .single();

      if (existing) {
        const remoteUpdated = new Date(existing.updated_at).getTime();
        const localUpdated = new Date(data.updated_at).getTime();

        if (this.shouldUseLocal(localUpdated, remoteUpdated)) {
          await supabase.from('goals').upsert(data);
        } else {
          await this.pullGoalFromRemote(data.id);
        }
      } else {
        await supabase.from('goals').insert(data);
      }
    } else if (action === 'delete') {
      await supabase.from('goals').delete().eq('id', data.id);
    }
  }

  /**
   * Sync focus session to Supabase
   */
  private async syncFocusSession(item: any): Promise<void> {
    const { data, action } = item;

    if (action === 'create') {
      // Focus sessions are append-only, no conflict resolution needed
      const { error } = await supabase.from('focus_sessions').insert(data);
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    }
  }

  /**
   * Pull remote changes from Supabase
   */
  private async pullRemoteChanges(): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const userId = user.user.id;
    const lastSync = this.syncStatus.lastSyncTime || 0;

    // Pull tasks updated since last sync
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(lastSync).toISOString());

    if (tasks) {
      for (const task of tasks) {
        await offlineStorage.saveTask(task);
      }
    }

    // Pull goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(lastSync).toISOString());

    if (goals) {
      for (const goal of goals) {
        await offlineStorage.saveGoal(goal);
      }
    }
  }

  /**
   * Pull specific task from remote
   */
  private async pullTaskFromRemote(taskId: string): Promise<void> {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (data) {
      await offlineStorage.saveTask(data);
    }
  }

  /**
   * Pull specific goal from remote
   */
  private async pullGoalFromRemote(goalId: string): Promise<void> {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (data) {
      await offlineStorage.saveGoal(data);
    }
  }

  /**
   * Determine conflict resolution
   */
  private shouldUseLocal(localTimestamp: number, remoteTimestamp: number): boolean {
    switch (this.conflictStrategy) {
      case 'local-wins':
        return true;
      case 'remote-wins':
        return false;
      case 'newest-wins':
      default:
        return localTimestamp > remoteTimestamp;
    }
  }

  /**
   * Update pending changes count
   */
  private async updatePendingCount(): Promise<void> {
    const items = await offlineStorage.getPendingSyncItems();
    this.syncStatus.pendingChanges = items.length;
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(intervalMs: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictStrategy = strategy;
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force immediate sync
   */
  async forceSyn(): Promise<void> {
    await this.sync(true);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    Network.removeAllListeners();
  }
}

// Singleton instance
export const syncManager = new SyncManager();
