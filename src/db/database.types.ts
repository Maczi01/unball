
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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          anon_device_token: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: number
        }
        Insert: {
          anon_device_token?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: number
        }
        Update: {
          anon_device_token?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: number
        }
        Relationships: []
      }
      daily_set_photos: {
        Row: {
          created_at: string
          daily_set_id: string
          photo_id: string
          position: number
        }
        Insert: {
          created_at?: string
          daily_set_id: string
          photo_id: string
          position: number
        }
        Update: {
          created_at?: string
          daily_set_id?: string
          photo_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_set_photos_daily_set_id_fkey"
            columns: ["daily_set_id"]
            isOneToOne: false
            referencedRelation: "daily_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_set_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_set_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_set_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_with_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sets: {
        Row: {
          created_at: string
          date_utc: string
          id: string
          is_published: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_utc: string
          id?: string
          is_published?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_utc?: string
          id?: string
          is_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      daily_submissions: {
        Row: {
          anon_device_token: string | null
          created_at: string
          daily_set_id: string
          date_utc: string
          id: string
          nickname: string
          submission_timestamp: string
          total_score: number
          total_time_ms: number
          user_id: string | null
        }
        Insert: {
          anon_device_token?: string | null
          created_at?: string
          daily_set_id: string
          date_utc: string
          id?: string
          nickname: string
          submission_timestamp?: string
          total_score: number
          total_time_ms: number
          user_id?: string | null
        }
        Update: {
          anon_device_token?: string | null
          created_at?: string
          daily_set_id?: string
          date_utc?: string
          id?: string
          nickname?: string
          submission_timestamp?: string
          total_score?: number
          total_time_ms?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_submissions_daily_set_id_fkey"
            columns: ["daily_set_id"]
            isOneToOne: false
            referencedRelation: "daily_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_nicknames: {
        Row: {
          anon_device_token: string
          consent_given_at: string | null
          created_at: string
          nickname: string
          updated_at: string
        }
        Insert: {
          anon_device_token: string
          consent_given_at?: string | null
          created_at?: string
          nickname: string
          updated_at?: string
        }
        Update: {
          anon_device_token?: string
          consent_given_at?: string | null
          created_at?: string
          nickname?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_more_info: {
        Row: {
          created_at: string
          description: string | null
          id: string
          info_type: string
          photo_id: string
          position: number
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          info_type: string
          photo_id: string
          position?: number
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          info_type?: string
          photo_id?: string
          position?: number
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_more_info_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_more_info_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_more_info_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_with_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_sources: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          position: number
          source_type: string | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          position?: number
          source_type?: string | null
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          position?: number
          source_type?: string | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_sources_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_sources_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_sources_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_with_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_submissions: {
        Row: {
          anon_device_token: string | null
          approved_photo_id: string | null
          competition: string | null
          created_at: string
          credit: string
          description: string | null
          event_name: string
          id: string
          lat: number
          license: string
          lon: number
          notes: string | null
          original_url: string | null
          photo_url: string
          place: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitter_email: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string | null
          year_utc: number
        }
        Insert: {
          anon_device_token?: string | null
          approved_photo_id?: string | null
          competition?: string | null
          created_at?: string
          credit: string
          description?: string | null
          event_name: string
          id?: string
          lat: number
          license: string
          lon: number
          notes?: string | null
          original_url?: string | null
          photo_url: string
          place?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitter_email?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          year_utc: number
        }
        Update: {
          anon_device_token?: string | null
          approved_photo_id?: string | null
          competition?: string | null
          created_at?: string
          credit?: string
          description?: string | null
          event_name?: string
          id?: string
          lat?: number
          license?: string
          lon?: number
          notes?: string | null
          original_url?: string | null
          photo_url?: string
          place?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitter_email?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          year_utc?: number
        }
        Relationships: [
          {
            foreignKeyName: "photo_submissions_approved_photo_id_fkey"
            columns: ["approved_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_approved_photo_id_fkey"
            columns: ["approved_photo_id"]
            isOneToOne: false
            referencedRelation: "photos_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_approved_photo_id_fkey"
            columns: ["approved_photo_id"]
            isOneToOne: false
            referencedRelation: "photos_with_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          competition: string | null
          created_at: string
          credit: string
          description: string | null
          event_name: string
          first_used_in_daily_date: string | null
          id: string
          is_daily_eligible: boolean
          lat: number
          license: string
          lon: number
          notes: string | null
          original_url: string | null
          photo_url: string
          place: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          year_utc: number
        }
        Insert: {
          competition?: string | null
          created_at?: string
          credit: string
          description?: string | null
          event_name: string
          first_used_in_daily_date?: string | null
          id?: string
          is_daily_eligible?: boolean
          lat: number
          license: string
          lon: number
          notes?: string | null
          original_url?: string | null
          photo_url: string
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          year_utc: number
        }
        Update: {
          competition?: string | null
          created_at?: string
          credit?: string
          description?: string | null
          event_name?: string
          first_used_in_daily_date?: string | null
          id?: string
          is_daily_eligible?: boolean
          lat?: number
          license?: string
          lon?: number
          notes?: string | null
          original_url?: string | null
          photo_url?: string
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          year_utc?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          can_add_photos: boolean
          consent_given_at: string | null
          created_at: string
          email: string | null
          id: string
          nickname: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          can_add_photos?: boolean
          consent_given_at?: string | null
          created_at?: string
          email?: string | null
          id: string
          nickname?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          can_add_photos?: boolean
          consent_given_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nickname?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_with_users: {
        Row: {
          date_utc: string | null
          id: string | null
          is_authenticated: boolean | null
          nickname: string | null
          submission_timestamp: string | null
          total_score: number | null
          total_time_ms: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      photos_metadata: {
        Row: {
          competition: string | null
          id: string | null
          photo_url: string | null
          place: string | null
          tags: string[] | null
          thumbnail_url: string | null
        }
        Insert: {
          competition?: string | null
          id?: string | null
          photo_url?: string | null
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Update: {
          competition?: string | null
          id?: string | null
          photo_url?: string | null
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      photos_with_answers: {
        Row: {
          competition: string | null
          credit: string | null
          description: string | null
          event_name: string | null
          id: string | null
          lat: number | null
          license: string | null
          lon: number | null
          photo_url: string | null
          place: string | null
          tags: string[] | null
          thumbnail_url: string | null
          year_utc: number | null
        }
        Insert: {
          competition?: string | null
          credit?: string | null
          description?: string | null
          event_name?: string | null
          id?: string | null
          lat?: number | null
          license?: string | null
          lon?: number | null
          photo_url?: string | null
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          year_utc?: number | null
        }
        Update: {
          competition?: string | null
          credit?: string | null
          description?: string | null
          event_name?: string | null
          id?: string | null
          lat?: number | null
          license?: string | null
          lon?: number | null
          photo_url?: string | null
          place?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          year_utc?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_photo_submission: {
        Args: {
          admin_id: string
          metadata_overrides?: Json
          set_daily_eligible?: boolean
          submission_id: string
        }
        Returns: string
      }
      reject_photo_submission: {
        Args: { admin_id: string; notes: string; submission_id: string }
        Returns: undefined
      }
    }
    Enums: {
      submission_status: "pending" | "approved" | "rejected"
      user_role: "user" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      submission_status: ["pending", "approved", "rejected"],
      user_role: ["user", "admin"],
    },
  },
} as const
