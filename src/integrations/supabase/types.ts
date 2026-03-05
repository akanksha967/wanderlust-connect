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
      access_requests: {
        Row: {
          email: string
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_itinerary_users: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_itinerary_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_likes: {
        Row: {
          id: string
          like_date: string
          likes_used: number
          max_likes: number
          profile_id: string
        }
        Insert: {
          id?: string
          like_date?: string
          likes_used?: number
          max_likes?: number
          profile_id: string
        }
        Update: {
          id?: string
          like_date?: string
          likes_used?: number
          max_likes?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          creator_profile_id: string
          expires_at: string | null
          id: string
          used_at: string | null
          used_by_profile_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          creator_profile_id: string
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by_profile_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          creator_profile_id?: string
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_profile_id_fkey"
            columns: ["used_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          profile1_id: string
          profile2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile1_id: string
          profile2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile1_id?: string
          profile2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile1_id_fkey"
            columns: ["profile1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile2_id_fkey"
            columns: ["profile2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          icon: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          profile_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          profile_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          profile_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string
          id: string
          invite_slots: number
          invited_by: string | null
          is_verified: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          bio?: string | null
          created_at?: string
          id?: string
          invite_slots?: number
          invited_by?: string | null
          is_verified?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          bio?: string | null
          created_at?: string
          id?: string
          invite_slots?: number
          invited_by?: string | null
          is_verified?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_interest: {
        Row: {
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_interest_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          revealed: boolean | null
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          revealed?: boolean | null
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          revealed?: boolean | null
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_plans: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          is_active: boolean | null
          profile_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          is_active?: boolean | null
          profile_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_vibes: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          vibe: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          vibe: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          vibe?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_vibes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string | null
          sender_id: string
          trip_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          sender_id: string
          trip_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          sender_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_stories: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_stories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: string | null
          created_at: string
          creator_id: string
          description: string | null
          destination: string
          end_date: string
          id: string
          is_active: boolean | null
          max_travelers: number | null
          share_code: string | null
          start_date: string
          title: string
          travel_style: string | null
          updated_at: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          destination: string
          end_date: string
          id?: string
          is_active?: boolean | null
          max_travelers?: number | null
          share_code?: string | null
          start_date: string
          title: string
          travel_style?: string | null
          updated_at?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          destination?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_travelers?: number | null
          share_code?: string | null
          start_date?: string
          title?: string
          travel_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ai_access: { Args: never; Returns: Json }
      check_and_increment_ai_usage: { Args: never; Returns: Json }
      check_user_access: { Args: never; Returns: Json }
      create_like_with_limit: {
        Args: { target_profile_id: string }
        Returns: Json
      }
      generate_invite_code: { Args: never; Returns: Json }
      get_daily_likes_remaining: { Args: never; Returns: Json }
      get_my_active_travel_plan: {
        Args: never
        Returns: {
          destination: string
          end_date: string
          start_date: string
        }[]
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_or_create_crew_chat: {
        Args: { p_other_profile_id: string }
        Returns: Json
      }
      handle_trip_join_request: {
        Args: { p_requester_id: string; p_trip_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reveal_like: { Args: { notification_id: string }; Returns: Json }
      use_invite_code: { Args: { invite_code: string }; Returns: Json }
      validate_invite_code: { Args: { invite_code: string }; Returns: Json }
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
