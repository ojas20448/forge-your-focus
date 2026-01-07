export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number | null
        }
        Relationships: []
      }
      affirmations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          schedule_times: Json | null
          text: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          schedule_times?: Json | null
          text: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          schedule_times?: Json | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          focus_minutes: number | null
          id: string
          tasks_completed: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          focus_minutes?: number | null
          id?: string
          tasks_completed?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          checkin_date?: string
          created_at?: string
          focus_minutes?: number | null
          id?: string
          tasks_completed?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_duration_minutes: number | null
          break_count: number | null
          created_at: string
          end_time: string | null
          id: string
          planned_duration_minutes: number
          start_time: string
          task_id: string | null
          total_break_minutes: number | null
          user_id: string
          was_completed: boolean | null
          xp_earned: number | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          break_count?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          planned_duration_minutes: number
          start_time: string
          task_id?: string | null
          total_break_minutes?: number | null
          user_id: string
          was_completed?: boolean | null
          xp_earned?: number | null
        }
        Update: {
          actual_duration_minutes?: number | null
          break_count?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          planned_duration_minutes?: number
          start_time?: string
          task_id?: string | null
          total_break_minutes?: number | null
          user_id?: string
          was_completed?: boolean | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          parent_goal_id: string | null
          progress: number | null
          success_criteria: Json | null
          target_date: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_goal_id?: string | null
          progress?: number | null
          success_criteria?: Json | null
          target_date?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_goal_id?: string | null
          progress?: number | null
          success_criteria?: Json | null
          target_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          max_xp: number | null
          min_xp: number
          name: string
          tier: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          max_xp?: number | null
          min_xp: number
          name: string
          tier: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          max_xp?: number | null
          min_xp?: number
          name?: string
          tier?: number
        }
        Relationships: []
      }
      manifestation_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          duration_minutes: number | null
          id: string
          journal_text: string | null
          session_type: string
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          journal_text?: string | null
          session_type: string
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          journal_text?: string | null
          session_type?: string
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number | null
          display_name: string | null
          id: string
          level: number | null
          longest_streak: number | null
          onboarding_completed: boolean | null
          sleep_time: string | null
          timezone: string | null
          total_xp: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          sleep_time?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          sleep_time?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      raid_members: {
        Row: {
          focus_hours: number
          id: string
          joined_at: string
          raid_id: string
          user_id: string
          xp_contributed: number
        }
        Insert: {
          focus_hours?: number
          id?: string
          joined_at?: string
          raid_id: string
          user_id: string
          xp_contributed?: number
        }
        Update: {
          focus_hours?: number
          id?: string
          joined_at?: string
          raid_id?: string
          user_id?: string
          xp_contributed?: number
        }
        Relationships: [
          {
            foreignKeyName: "raid_members_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "raids"
            referencedColumns: ["id"]
          },
        ]
      }
      raids: {
        Row: {
          created_at: string
          created_by: string
          current_hours: number
          description: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          reward: string | null
          starts_at: string
          target_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_hours?: number
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          reward?: string | null
          starts_at?: string
          target_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_hours?: number
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reward?: string | null
          starts_at?: string
          target_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          end_time: string
          goal_id: string | null
          id: string
          is_completed: boolean | null
          is_verified: boolean | null
          priority: string | null
          scheduled_date: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
          verification_photo_url: string | null
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          end_time: string
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          is_verified?: boolean | null
          priority?: string | null
          scheduled_date: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
          verification_photo_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          is_verified?: boolean | null
          priority?: string | null
          scheduled_date?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
          verification_photo_url?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_league_history: {
        Row: {
          created_at: string
          id: string
          league_id: string
          rank_position: number | null
          user_id: string
          week_end: string
          week_start: string
          weekly_xp: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          rank_position?: number | null
          user_id: string
          week_end: string
          week_start: string
          weekly_xp?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          rank_position?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
          weekly_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_league_history_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vision_board_items: {
        Row: {
          caption: string | null
          created_at: string
          height: number | null
          id: string
          image_url: string
          position_x: number | null
          position_y: number | null
          user_id: string
          vision_board_id: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url: string
          position_x?: number | null
          position_y?: number | null
          user_id: string
          vision_board_id: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string
          position_x?: number | null
          position_y?: number | null
          user_id?: string
          vision_board_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_board_items_vision_board_id_fkey"
            columns: ["vision_board_id"]
            isOneToOne: false
            referencedRelation: "vision_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
