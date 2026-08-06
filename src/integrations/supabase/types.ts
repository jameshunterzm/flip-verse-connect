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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          advertiser: string
          allow_engagement: boolean
          created_at: string
          cta_label: string
          cta_url: string
          id: string
          impressions: number
          media_url: string
          poster_url: string | null
          status: Database["public"]["Enums"]["ad_status"]
          title: string
        }
        Insert: {
          advertiser: string
          allow_engagement?: boolean
          created_at?: string
          cta_label?: string
          cta_url: string
          id?: string
          impressions?: number
          media_url: string
          poster_url?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
        }
        Update: {
          advertiser?: string
          allow_engagement?: boolean
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          impressions?: number
          media_url?: string
          poster_url?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_pages: {
        Row: {
          ads_enabled: boolean
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          featured: boolean
          gifts_enabled: boolean
          handle: string
          id: string
          link_url: string | null
          name: string
          name_changed_at: string | null
          owner_id: string
          suspended: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          ads_enabled?: boolean
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          gifts_enabled?: boolean
          handle: string
          id?: string
          link_url?: string | null
          name: string
          name_changed_at?: string | null
          owner_id: string
          suspended?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          ads_enabled?: boolean
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          gifts_enabled?: boolean
          handle?: string
          id?: string
          link_url?: string | null
          name?: string
          name_changed_at?: string | null
          owner_id?: string
          suspended?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          page_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          page_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "creator_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user: string
          id: string
          status: Database["public"]["Enums"]["request_status"]
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          to_user?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      monetization_applications: {
        Row: {
          created_at: string
          id: string
          note: string
          owner_id: string
          page_id: string
          program: Database["public"]["Enums"]["monetization_program"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          owner_id: string
          page_id: string
          program: Database["public"]["Enums"]["monetization_program"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          page_id?: string
          program?: Database["public"]["Enums"]["monetization_program"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monetization_applications_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "creator_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          post_id: string | null
          read: boolean
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind: string
          post_id?: string | null
          read?: boolean
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          post_id?: string | null
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          ad_frequency: number
          ad_revenue_share: number
          gift_revenue_share: number
          id: boolean
          updated_at: string
        }
        Insert: {
          ad_frequency?: number
          ad_revenue_share?: number
          gift_revenue_share?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          ad_frequency?: number
          ad_revenue_share?: number
          gift_revenue_share?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          creator_page_id: string | null
          duration_seconds: number | null
          format: Database["public"]["Enums"]["video_format"] | null
          hashtags: string[]
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          media_url: string
          poster_url: string | null
          removed: boolean
          trim_end: number | null
          trim_start: number
          views_count: number
          visibility: Database["public"]["Enums"]["post_visibility"]
          watch_seconds: number
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          creator_page_id?: string | null
          duration_seconds?: number | null
          format?: Database["public"]["Enums"]["video_format"] | null
          hashtags?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          media_url: string
          poster_url?: string | null
          removed?: boolean
          trim_end?: number | null
          trim_start?: number
          views_count?: number
          visibility?: Database["public"]["Enums"]["post_visibility"]
          watch_seconds?: number
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          creator_page_id?: string | null
          duration_seconds?: number | null
          format?: Database["public"]["Enums"]["video_format"] | null
          hashtags?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          media_url?: string
          poster_url?: string | null
          removed?: boolean
          trim_end?: number | null
          trim_start?: number
          views_count?: number
          visibility?: Database["public"]["Enums"]["post_visibility"]
          watch_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_page_id_fkey"
            columns: ["creator_page_id"]
            isOneToOne: false
            referencedRelation: "creator_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          friends_only_comments: boolean
          id: string
          last_seen: string
          name_changes: string[]
          private_account: boolean
          show_online: boolean
          suspended: boolean
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          friends_only_comments?: boolean
          id: string
          last_seen?: string
          name_changes?: string[]
          private_account?: boolean
          show_online?: boolean
          suspended?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          friends_only_comments?: boolean
          id?: string
          last_seen?: string
          name_changes?: string[]
          private_account?: boolean
          show_online?: boolean
          suspended?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reported_user: string | null
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reported_user?: string | null
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reported_user?: string | null
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
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
      accept_friend_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_view: { Args: { _post_id: string }; Returns: undefined }
      post_visible: { Args: { _post_id: string }; Returns: boolean }
      remove_friend: { Args: { _other: string }; Returns: undefined }
    }
    Enums: {
      ad_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "moderator" | "user"
      application_status: "pending" | "approved" | "rejected"
      monetization_program: "gifts" | "ads"
      post_kind: "clip" | "image"
      post_visibility: "friends" | "public"
      request_status: "pending" | "accepted" | "declined"
      video_format: "short" | "long"
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
      ad_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "moderator", "user"],
      application_status: ["pending", "approved", "rejected"],
      monetization_program: ["gifts", "ads"],
      post_kind: ["clip", "image"],
      post_visibility: ["friends", "public"],
      request_status: ["pending", "accepted", "declined"],
      video_format: ["short", "long"],
    },
  },
} as const
