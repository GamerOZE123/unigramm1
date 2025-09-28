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
          advertising_post_id: string | null
          id: string
          view_time: string | null
        }
        Insert: {
          advertising_post_id?: string | null
          id?: string
          view_time?: string | null
        }
        Update: {
          advertising_post_id?: string | null
          id?: string
          view_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertising_post_views_advertising_post_id_fkey"
            columns: ["advertising_post_id"]
            isOneToOne: false
            referencedRelation: "advertising_posts"
            referencedColumns: ["id"]
          },
        ]
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
          amount: number | null
          auction_id: string | null
          bid_amount: number | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          auction_id?: string | null
          bid_amount?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          auction_id?: string | null
          bid_amount?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          created_at: string | null
          current_price: number | null
          description: string | null
          end_time: string | null
          id: string
          image_urls: string[] | null
          item_name: string | null
          starting_price: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_urls?: string[] | null
          item_name?: string | null
          starting_price?: number | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_urls?: string[] | null
          item_name?: string | null
          starting_price?: number | null
          title?: string | null
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
          current_progress: number | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
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
          cleared_at: string | null
          conversation_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          cleared_at?: string | null
          conversation_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          cleared_at?: string | null
          conversation_id?: string | null
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
          admin_user_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          member_count: number | null
          name: string | null
        }
        Insert: {
          admin_user_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name?: string | null
        }
        Update: {
          admin_user_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
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
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
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
          conversation_id: string | null
          deleted_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          deleted_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          deleted_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fitness_challenges: {
        Row: {
          challenge_name: string | null
          challenge_type: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          target_unit: string | null
          target_value: number | null
          title: string | null
        }
        Insert: {
          challenge_name?: string | null
          challenge_type?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title?: string | null
        }
        Update: {
          challenge_name?: string | null
          challenge_type?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title?: string | null
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
          created_at: string | null
          current_attendees: number | null
          date: string | null
          description: string | null
          event_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          max_attendees: number | null
          organizer_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          date?: string | null
          description?: string | null
          event_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          date?: string | null
          description?: string | null
          event_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          title?: string | null
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
          created_at: string | null
          id: string
          job_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
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
          description: string | null
          icon: string | null
          id: string
          name: string | null
        }
        Insert: {
          category_name?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          category_name?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean | null
          item_name: string | null
          location: string | null
          price: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean | null
          item_name?: string | null
          location?: string | null
          price?: number | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean | null
          item_name?: string | null
          location?: string | null
          price?: number | null
          title?: string | null
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
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
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
          comments_count: number | null
          content: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          likes_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          likes_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          likes_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_position: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          major: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_position?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          major?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_position?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          major?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
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
      get_challenge_participant_count: {
        Args: { challenge_uuid: string }
        Returns: number
      }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_recent_chats: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          last_message: string
          last_message_time: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          unread_count: number
        }[]
      }
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
      get_user_conversations: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          last_message_at: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
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
