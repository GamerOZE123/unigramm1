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
  public: {
    Tables: {
      advertising_clicks: {
        Row: {
          advertising_post_id: string | null
          click_time: string | null
          id: string
        }
        Insert: {
          advertising_post_id?: string | null
          click_time?: string | null
          id?: string
        }
        Update: {
          advertising_post_id?: string | null
          click_time?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertising_clicks_advertising_post_id_fkey"
            columns: ["advertising_post_id"]
            isOneToOne: false
            referencedRelation: "advertising_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      advertising_likes: {
        Row: {
          advertising_post_id: string | null
          id: string
          like_time: string | null
        }
        Insert: {
          advertising_post_id?: string | null
          id?: string
          like_time?: string | null
        }
        Update: {
          advertising_post_id?: string | null
          id?: string
          like_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertising_likes_advertising_post_id_fkey"
            columns: ["advertising_post_id"]
            isOneToOne: false
            referencedRelation: "advertising_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      advertising_post_views: {
        Row: {
          id: string
          view_time: string | null
        }
        Insert: {
          id?: string
          view_time?: string | null
        }
        Update: {
          id?: string
          view_time?: string | null
        }
        Relationships: []
      }
      advertising_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          bid_amount: number | null
          id: string
        }
        Insert: {
          bid_amount?: number | null
          id?: string
        }
        Update: {
          bid_amount?: number | null
          id?: string
        }
        Relationships: []
      }
      auctions: {
        Row: {
          id: string
          item_name: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          item_name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          item_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string | null
          id: string
        }
        Insert: {
          blocked_user_id?: string | null
          id?: string
        }
        Update: {
          blocked_user_id?: string | null
          id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string | null
          id: string
        }
        Insert: {
          challenge_id?: string | null
          id?: string
        }
        Update: {
          challenge_id?: string | null
          id?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          id: string
          progress_value: number | null
        }
        Insert: {
          id?: string
          progress_value?: number | null
        }
        Update: {
          id?: string
          progress_value?: number | null
        }
        Relationships: []
      }
      cleared_chats: {
        Row: {
          id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          club_id: string | null
          id: string
        }
        Insert: {
          club_id?: string | null
          id?: string
        }
        Update: {
          club_id?: string | null
          id?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          id: string
          name: string | null
        }
        Insert: {
          id?: string
          name?: string | null
        }
        Update: {
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
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
      company_profiles: {
        Row: {
          company_description: string | null
          company_logo: string | null
          company_name: string | null
          company_size: string | null
          created_at: string | null
          id: string
          industry: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          company_description?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          company_description?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          last_message_at?: string | null
        }
        Update: {
          id?: string
          last_message_at?: string | null
        }
        Relationships: []
      }
      deleted_chats: {
        Row: {
          id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fitness_challenges: {
        Row: {
          challenge_name: string | null
          id: string
        }
        Insert: {
          challenge_name?: string | null
          id?: string
        }
        Update: {
          challenge_name?: string | null
          id?: string
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          followed_id: string | null
          follower_id: string | null
          id: string
        }
        Insert: {
          followed_id?: string | null
          follower_id?: string | null
          id?: string
        }
        Update: {
          followed_id?: string | null
          follower_id?: string | null
          id?: string
        }
        Relationships: []
      }
      holiday_attendees: {
        Row: {
          event_id: string | null
          id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
        }
        Update: {
          event_id?: string | null
          id?: string
        }
        Relationships: []
      }
      holiday_events: {
        Row: {
          event_name: string | null
          id: string
        }
        Insert: {
          event_name?: string | null
          id?: string
        }
        Update: {
          event_name?: string | null
          id?: string
        }
        Relationships: []
      }
      homepage_banner_clicks: {
        Row: {
          click_time: string | null
          id: string
        }
        Insert: {
          click_time?: string | null
          id?: string
        }
        Update: {
          click_time?: string | null
          id?: string
        }
        Relationships: []
      }
      homepage_banner_views: {
        Row: {
          id: string
          view_time: string | null
        }
        Insert: {
          id?: string
          view_time?: string | null
        }
        Update: {
          id?: string
          view_time?: string | null
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          banner_title: string | null
          id: string
        }
        Insert: {
          banner_title?: string | null
          id?: string
        }
        Update: {
          banner_title?: string | null
          id?: string
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      item_favorites: {
        Row: {
          id: string
          item_id: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string | null
          id: string
          job_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_swipes: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          student_id: string | null
          swipe_direction: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          student_id?: string | null
          swipe_direction?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          student_id?: string | null
          swipe_direction?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_swipes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          created_at: string | null
          description: string | null
          experience_level: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          job_type: string | null
          location: string | null
          requirements: string | null
          salary_range: string | null
          skills_required: string[] | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          skills_required?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          application_deadline?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          skills_required?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          category_name: string | null
          id: string
        }
        Insert: {
          category_name?: string | null
          id?: string
        }
        Update: {
          category_name?: string | null
          id?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          id: string
          item_name: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          item_name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          item_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          id: string
          reaction_type: string | null
        }
        Insert: {
          id?: string
          reaction_type?: string | null
        }
        Update: {
          id?: string
          reaction_type?: string | null
        }
        Relationships: []
      }
      message_status: {
        Row: {
          id: string
          status: string | null
        }
        Insert: {
          id?: string
          status?: string | null
        }
        Update: {
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          id: string
        }
        Insert: {
          content?: string | null
          id?: string
        }
        Update: {
          content?: string | null
          id?: string
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          created_at: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          session_id?: string
        }
        Relationships: []
      }
      mfa_challenges: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mfa_factors: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          message: string | null
        }
        Insert: {
          id?: string
          message?: string | null
        }
        Update: {
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      one_time_tokens: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_views: {
        Row: {
          id: string
          post_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_urls: string[] | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      ranked_posts: {
        Row: {
          id: string
          post_id: string | null
          rank: number | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          rank?: number | null
        }
        Update: {
          id?: string
          post_id?: string | null
          rank?: number | null
        }
        Relationships: []
      }
      recent_chats: {
        Row: {
          conversation_id: string | null
          id: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
        }
        Relationships: []
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saml_providers: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      scheduled_workouts: {
        Row: {
          id: string
          workout_time: string | null
        }
        Insert: {
          id?: string
          workout_time?: string | null
        }
        Update: {
          id?: string
          workout_time?: string | null
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sso_domains: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      sso_providers: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          certificates: string[] | null
          created_at: string | null
          education: string | null
          experience_level: string | null
          github_url: string | null
          gpa: number | null
          graduation_year: number | null
          id: string
          linkedin_url: string | null
          major: string | null
          portfolio_url: string | null
          preferred_job_types: string[] | null
          preferred_location: string | null
          skills: string[] | null
          student_name: string | null
          university: string | null
          user_id: string | null
          work_experience: string | null
        }
        Insert: {
          certificates?: string[] | null
          created_at?: string | null
          education?: string | null
          experience_level?: string | null
          github_url?: string | null
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          major?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_location?: string | null
          skills?: string[] | null
          student_name?: string | null
          university?: string | null
          user_id?: string | null
          work_experience?: string | null
        }
        Update: {
          certificates?: string[] | null
          created_at?: string | null
          education?: string | null
          experience_level?: string | null
          github_url?: string | null
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          major?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_location?: string | null
          skills?: string[] | null
          student_name?: string | null
          university?: string | null
          user_id?: string | null
          work_experience?: string | null
        }
        Relationships: []
      }
      trending_hashtags: {
        Row: {
          hashtag: string | null
          id: string
        }
        Insert: {
          hashtag?: string | null
          id?: string
        }
        Update: {
          hashtag?: string | null
          id?: string
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          id: string
          is_typing: boolean | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          online_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          online_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          online_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          session_start: string | null
        }
        Insert: {
          id?: string
          session_start?: string | null
        }
        Update: {
          id?: string
          session_start?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          workout_name: string | null
        }
        Insert: {
          id?: string
          workout_name?: string | null
        }
        Update: {
          id?: string
          workout_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unswiped_jobs_for_student: {
        Args: { student_user_id: string }
        Returns: {
          company_logo: string
          company_name: string
          description: string
          job_id: string
          job_type: string
          location: string
          salary_range: string
          skills_required: string[]
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
