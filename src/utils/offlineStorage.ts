// Offline storage manager using SQLite for mobile app
// Provides local-first architecture with sync capabilities

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Task, Goal, FocusSession } from '@/types/focusforge';

// Sync queue item for tracking changes to sync
interface SyncQueueItem {
  id: string;
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retries: number;
}

class OfflineStorageManager {
  private db: SQLiteDBConnection | null = null;
  private sqlite: SQLiteConnection | null = null;
  private dbName = 'xecute.db';
  private isInitialized = false;

  /**
   * Initialize SQLite database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('SQLite not available on web platform, using IndexedDB fallback');
      this.isInitialized = true;
      return;
    }

    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      
      // Create connection
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Offline storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    const queries = [
      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        xp_value INTEGER NOT NULL,
        goal_id TEXT,
        verification_required INTEGER DEFAULT 0,
        decay_rate REAL DEFAULT 1.0,
        current_condition REAL DEFAULT 100.0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        is_deleted INTEGER DEFAULT 0
      )`,

      // Goals table
      `CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date INTEGER,
        progress REAL DEFAULT 0,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_deleted INTEGER DEFAULT 0
      )`,

      // Focus sessions table
      `CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration_minutes INTEGER NOT NULL,
        xp_earned INTEGER NOT NULL,
        verification_score REAL,
        breaks_count INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        is_deleted INTEGER DEFAULT 0
      )`,

      // Sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        retries INTEGER DEFAULT 0,
        error TEXT
      )`,

      // User profile cache
      `CREATE TABLE IF NOT EXISTS user_profile (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        avatar_url TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        debt_score REAL DEFAULT 0,
        energy_profile TEXT DEFAULT 'balanced',
        updated_at INTEGER NOT NULL
      )`,

      // Create indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON focus_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_task ON focus_sessions(task_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)`,
    ];

    for (const query of queries) {
      await this.db.execute(query);
    }
  }

  /**
   * Save task to local storage
   */
  async saveTask(task: Task): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT OR REPLACE INTO tasks (
        id, user_id, title, description, priority, status, duration_min, xp_value,
        goal_id, verification_required, decay_rate, current_condition,
        created_at, updated_at, completed_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      task.id,
      task.user_id,
      task.title,
      task.description || '',
      task.priority,
      task.status,
      task.duration_min,
      task.xp_value,
      task.goal_id || null,
      task.verification_required ? 1 : 0,
      task.decay_rate || 1.0,
      task.current_condition || 100.0,
      new Date(task.created_at).getTime(),
      new Date(task.updated_at).getTime(),
      task.completed_at ? new Date(task.completed_at).getTime() : null,
      0
    ];

    await this.db.run(query, values);
    
    // Add to sync queue
    await this.addToSyncQueue('tasks', 'update', task);
  }

  /**
   * Get all tasks for user
   */
  async getTasks(userId: string, includeCompleted: boolean = false): Promise<Task[]> {
    if (!this.db) return [];

    const query = `
      SELECT * FROM tasks 
      WHERE user_id = ? AND is_deleted = 0
      ${includeCompleted ? '' : "AND status != 'completed'"}
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    
    if (!result.values) return [];

    return result.values.map(row => this.rowToTask(row));
  }

  /**
   * Save goal to local storage
   */
  async saveGoal(goal: Goal): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT OR REPLACE INTO goals (
        id, user_id, title, description, target_date, progress, status,
        created_at, updated_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      goal.id,
      goal.user_id,
      goal.title,
      goal.description || '',
      goal.target_date ? new Date(goal.target_date).getTime() : null,
      goal.progress || 0,
      goal.status,
      new Date(goal.created_at).getTime(),
      new Date(goal.updated_at).getTime(),
      0
    ];

    await this.db.run(query, values);
    await this.addToSyncQueue('goals', 'update', goal);
  }

  /**
   * Save focus session
   */
  async saveFocusSession(session: FocusSession): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT OR REPLACE INTO focus_sessions (
        id, user_id, task_id, start_time, end_time, duration_minutes,
        xp_earned, verification_score, breaks_count, completed, created_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      session.id,
      session.user_id,
      session.task_id,
      new Date(session.start_time).getTime(),
      session.end_time ? new Date(session.end_time).getTime() : null,
      session.duration_minutes,
      session.xp_earned,
      session.verification_score || null,
      session.breaks_count || 0,
      session.completed ? 1 : 0,
      new Date().getTime(),
      0
    ];

    await this.db.run(query, values);
    await this.addToSyncQueue('focus_sessions', 'create', session);
  }

  /**
   * Add item to sync queue
   */
  private async addToSyncQueue(table: string, action: string, data: any): Promise<void> {
    if (!this.db) return;

    const id = `${table}_${data.id}_${Date.now()}`;
    const query = `
      INSERT INTO sync_queue (id, table_name, action, data, timestamp, synced, retries)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `;

    await this.db.run(query, [
      id,
      table,
      action,
      JSON.stringify(data),
      Date.now()
    ]);
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];

    const query = `
      SELECT * FROM sync_queue 
      WHERE synced = 0 AND retries < 3
      ORDER BY timestamp ASC
      LIMIT 50
    `;

    const result = await this.db.query(query);
    
    if (!result.values) return [];

    return result.values.map(row => ({
      id: row.id,
      table: row.table_name,
      action: row.action,
      data: JSON.parse(row.data),
      timestamp: row.timestamp,
      synced: row.synced === 1,
      retries: row.retries
    }));
  }

  /**
   * Mark sync item as synced
   */
  async markSynced(syncId: string): Promise<void> {
    if (!this.db) return;

    const query = `UPDATE sync_queue SET synced = 1 WHERE id = ?`;
    await this.db.run(query, [syncId]);
  }

  /**
   * Increment retry count for failed sync
   */
  async incrementRetry(syncId: string, error: string): Promise<void> {
    if (!this.db) return;

    const query = `
      UPDATE sync_queue 
      SET retries = retries + 1, error = ?
      WHERE id = ?
    `;
    await this.db.run(query, [error, syncId]);
  }

  /**
   * Clear synced items older than 7 days
   */
  async clearOldSyncedItems(): Promise<void> {
    if (!this.db) return;

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const query = `
      DELETE FROM sync_queue 
      WHERE synced = 1 AND timestamp < ?
    `;
    await this.db.run(query, [sevenDaysAgo]);
  }

  /**
   * Helper: Convert database row to Task
   */
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      duration_min: row.duration_min,
      xp_value: row.xp_value,
      goal_id: row.goal_id,
      verification_required: row.verification_required === 1,
      decay_rate: row.decay_rate,
      current_condition: row.current_condition,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db && this.sqlite) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();
