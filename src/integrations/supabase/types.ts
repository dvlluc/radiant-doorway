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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_stats: {
        Row: {
          business_id: string
          cancelled_appointments: number
          completed_appointments: number
          created_at: string
          customer_id: string | null
          id: string
          no_show_appointments: number
          staff_member_id: string | null
          total_appointments: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          business_id: string
          cancelled_appointments?: number
          completed_appointments?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          no_show_appointments?: number
          staff_member_id?: string | null
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancelled_appointments?: number
          completed_appointments?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          no_show_appointments?: number
          staff_member_id?: string | null
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          end_time: string
          id: string
          qr_code: string | null
          reminder_sent_at: string | null
          service_type: string | null
          staff_member_id: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_time: string
          id?: string
          qr_code?: string | null
          reminder_sent_at?: string | null
          service_type?: string | null
          staff_member_id?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_time?: string
          id?: string
          qr_code?: string | null
          reminder_sent_at?: string | null
          service_type?: string | null
          staff_member_id?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bellomart_seller_interests: {
        Row: {
          about_business: string | null
          business_name: string | null
          business_type: string
          contact_name: string
          created_at: string
          email: string
          expected_sales_volume: string | null
          id: string
          phone: string | null
          product_category: string
          shipping_interest: string | null
          status: string
          updated_at: string
          user_id: string
          virtual_tryon_interest: string | null
          website: string | null
        }
        Insert: {
          about_business?: string | null
          business_name?: string | null
          business_type: string
          contact_name: string
          created_at?: string
          email: string
          expected_sales_volume?: string | null
          id?: string
          phone?: string | null
          product_category: string
          shipping_interest?: string | null
          status?: string
          updated_at?: string
          user_id: string
          virtual_tryon_interest?: string | null
          website?: string | null
        }
        Update: {
          about_business?: string | null
          business_name?: string | null
          business_type?: string
          contact_name?: string
          created_at?: string
          email?: string
          expected_sales_volume?: string | null
          id?: string
          phone?: string | null
          product_category?: string
          shipping_interest?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          virtual_tryon_interest?: string | null
          website?: string | null
        }
        Relationships: []
      }
      bellomart_waitlist: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      blocked_time: {
        Row: {
          business_id: string
          created_at: string
          end_time: string
          id: string
          reason: string | null
          repeat_days: string[] | null
          repeat_end_date: string | null
          repeat_type: string
          staff_member_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          repeat_days?: string[] | null
          repeat_end_date?: string | null
          repeat_type?: string
          staff_member_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          repeat_days?: string[] | null
          repeat_end_date?: string | null
          repeat_type?: string
          staff_member_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          about_us: string | null
          address: string
          avatar_url: string | null
          brand_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          interests: string[] | null
          last_name: string
          logo_url: string | null
          profile_completed: boolean | null
          telephone: string | null
          updated_at: string
          user_id: string
          wants_booking: boolean | null
          wants_premium: boolean | null
          website: string | null
        }
        Insert: {
          about_us?: string | null
          address: string
          avatar_url?: string | null
          brand_name: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          interests?: string[] | null
          last_name: string
          logo_url?: string | null
          profile_completed?: boolean | null
          telephone?: string | null
          updated_at?: string
          user_id: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Update: {
          about_us?: string | null
          address?: string
          avatar_url?: string | null
          brand_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interests?: string[] | null
          last_name?: string
          logo_url?: string | null
          profile_completed?: boolean | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      business_forms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          template: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          template: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          template?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: string
          id: string
          is_open: boolean
          open_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: string
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: string
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_photo_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photo_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "business_photo_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_photo_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          photo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          photo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          photo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photo_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "business_photo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "business_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      business_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          photo_type: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_type?: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_type?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          about_us: string | null
          address: string
          avatar_url: string | null
          business_name: string
          category: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          interests: string[] | null
          last_name: string
          logo_url: string | null
          profile_completed: boolean | null
          telephone: string | null
          updated_at: string
          user_id: string
          wants_booking: boolean | null
          wants_premium: boolean | null
          website: string | null
        }
        Insert: {
          about_us?: string | null
          address: string
          avatar_url?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          interests?: string[] | null
          last_name: string
          logo_url?: string | null
          profile_completed?: boolean | null
          telephone?: string | null
          updated_at?: string
          user_id: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Update: {
          about_us?: string | null
          address?: string
          avatar_url?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interests?: string[] | null
          last_name?: string
          logo_url?: string | null
          profile_completed?: boolean | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          appointment_booking_enabled: boolean
          created_at: string
          deposit_enabled: boolean
          deposit_percentage: number
          id: string
          refund_policy_hours: number
          show_opening_hours: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_booking_enabled?: boolean
          created_at?: string
          deposit_enabled?: boolean
          deposit_percentage?: number
          id?: string
          refund_policy_hours?: number
          show_opening_hours?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_booking_enabled?: boolean
          created_at?: string
          deposit_enabled?: boolean
          deposit_percentage?: number
          id?: string
          refund_policy_hours?: number
          show_opening_hours?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_data: Json | null
          item_type: string | null
          price: number
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_data?: Json | null
          item_type?: string | null
          price: number
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_data?: Json | null
          item_type?: string | null
          price?: number
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      charitable_profiles: {
        Row: {
          about_us: string | null
          address: string
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          interests: string[] | null
          last_name: string
          logo_url: string | null
          organization_name: string
          profile_completed: boolean | null
          registration_number: string
          telephone: string | null
          updated_at: string
          user_id: string
          wants_booking: boolean | null
          wants_premium: boolean | null
          website: string | null
        }
        Insert: {
          about_us?: string | null
          address: string
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          interests?: string[] | null
          last_name: string
          logo_url?: string | null
          organization_name: string
          profile_completed?: boolean | null
          registration_number: string
          telephone?: string | null
          updated_at?: string
          user_id: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Update: {
          about_us?: string | null
          address?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          interests?: string[] | null
          last_name?: string
          logo_url?: string | null
          organization_name?: string
          profile_completed?: boolean | null
          registration_number?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
          wants_booking?: boolean | null
          wants_premium?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_records: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          medical_conditions: string | null
          notes: string | null
          special_requirements: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          medical_conditions?: string | null
          notes?: string | null
          special_requirements?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          medical_conditions?: string | null
          notes?: string | null
          special_requirements?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_subscriptions: {
        Row: {
          cancel_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          event_id: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          event_id?: string | null
          id?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          event_id?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_subscriptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          available_tickets: number | null
          booking_fee: number | null
          created_at: string
          event_id: string
          id: string
          price: number
          sales_end_date: string | null
          ticket_description: string | null
          ticket_name: string
          total_tickets: number | null
          updated_at: string
        }
        Insert: {
          available_tickets?: number | null
          booking_fee?: number | null
          created_at?: string
          event_id: string
          id?: string
          price: number
          sales_end_date?: string | null
          ticket_description?: string | null
          ticket_name: string
          total_tickets?: number | null
          updated_at?: string
        }
        Update: {
          available_tickets?: number | null
          booking_fee?: number | null
          created_at?: string
          event_id?: string
          id?: string
          price?: number
          sales_end_date?: string | null
          ticket_description?: string | null
          ticket_name?: string
          total_tickets?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          activities: string | null
          attendee_count: number | null
          available_tickets: number | null
          benefits: string[] | null
          booking_fee: number | null
          category: string | null
          city_town: string | null
          contact_preference: string | null
          country_region: string | null
          created_at: string
          currency_code: string | null
          currency_symbol: string | null
          custom_ticket_template: string | null
          date: string
          description: string | null
          end_time: string | null
          external_ticket_url: string | null
          id: string
          image_urls: string[] | null
          location: string
          nearby_hotels: string[] | null
          parking_details: string[] | null
          price: number | null
          refund_policy: string | null
          sales_end_date: string | null
          sponsors: Json | null
          state_province: string | null
          street_address: string | null
          subscription_fee: number | null
          ticket_description: string | null
          ticket_design_option: string | null
          ticket_name: string | null
          ticketing_model: string | null
          time: string | null
          title: string
          total_tickets: number | null
          transportation: string[] | null
          updated_at: string
          user_id: string
          video_url: string | null
          zip_postal_code: string | null
        }
        Insert: {
          activities?: string | null
          attendee_count?: number | null
          available_tickets?: number | null
          benefits?: string[] | null
          booking_fee?: number | null
          category?: string | null
          city_town?: string | null
          contact_preference?: string | null
          country_region?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          custom_ticket_template?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          external_ticket_url?: string | null
          id?: string
          image_urls?: string[] | null
          location: string
          nearby_hotels?: string[] | null
          parking_details?: string[] | null
          price?: number | null
          refund_policy?: string | null
          sales_end_date?: string | null
          sponsors?: Json | null
          state_province?: string | null
          street_address?: string | null
          subscription_fee?: number | null
          ticket_description?: string | null
          ticket_design_option?: string | null
          ticket_name?: string | null
          ticketing_model?: string | null
          time?: string | null
          title: string
          total_tickets?: number | null
          transportation?: string[] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          zip_postal_code?: string | null
        }
        Update: {
          activities?: string | null
          attendee_count?: number | null
          available_tickets?: number | null
          benefits?: string[] | null
          booking_fee?: number | null
          category?: string | null
          city_town?: string | null
          contact_preference?: string | null
          country_region?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          custom_ticket_template?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          external_ticket_url?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string
          nearby_hotels?: string[] | null
          parking_details?: string[] | null
          price?: number | null
          refund_policy?: string | null
          sales_end_date?: string | null
          sponsors?: Json | null
          state_province?: string | null
          street_address?: string | null
          subscription_fee?: number | null
          ticket_description?: string | null
          ticket_design_option?: string | null
          ticket_name?: string | null
          ticketing_model?: string | null
          time?: string | null
          title?: string
          total_tickets?: number | null
          transportation?: string[] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          zip_postal_code?: string | null
        }
        Relationships: []
      }
      featured_resumes: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string
          created_at: string
          display_count: number
          first_name: string | null
          id: string
          is_active: boolean
          last_displayed_at: string | null
          linkedin_url: string | null
          name: string
          resume_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_email: string
          created_at?: string
          display_count?: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_displayed_at?: string | null
          linkedin_url?: string | null
          name: string
          resume_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string
          created_at?: string
          display_count?: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_displayed_at?: string | null
          linkedin_url?: string | null
          name?: string
          resume_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followed_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      hidden_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          applicant_references: string | null
          cover_letter: string | null
          created_at: string
          education: string | null
          email: string | null
          experiences: Json | null
          first_name: string | null
          id: string
          interview_availability: string | null
          job_id: string
          last_name: string | null
          linkedin_url: string | null
          phone: string | null
          poster_id: string
          resume_url: string | null
          status: string
          supporting_statements: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applicant_references?: string | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experiences?: Json | null
          first_name?: string | null
          id?: string
          interview_availability?: string | null
          job_id: string
          last_name?: string | null
          linkedin_url?: string | null
          phone?: string | null
          poster_id: string
          resume_url?: string | null
          status?: string
          supporting_statements?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applicant_references?: string | null
          cover_letter?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experiences?: Json | null
          first_name?: string | null
          id?: string
          interview_availability?: string | null
          job_id?: string
          last_name?: string | null
          linkedin_url?: string | null
          phone?: string | null
          poster_id?: string
          resume_url?: string | null
          status?: string
          supporting_statements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_details: Json | null
          application_method: string
          apply_by_date: string | null
          benefits: string[]
          category: string
          company: string
          created_at: string
          description: string
          education_requirements: string | null
          experience: string
          id: string
          location: string
          requirements: string[]
          salary: string
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          application_details?: Json | null
          application_method: string
          apply_by_date?: string | null
          benefits?: string[]
          category: string
          company: string
          created_at?: string
          description: string
          education_requirements?: string | null
          experience: string
          id?: string
          location: string
          requirements?: string[]
          salary: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          application_details?: Json | null
          application_method?: string
          apply_by_date?: string | null
          benefits?: string[]
          category?: string
          company?: string
          created_at?: string
          description?: string
          education_requirements?: string | null
          experience?: string
          id?: string
          location?: string
          requirements?: string[]
          salary?: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
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
      muted_users: {
        Row: {
          created_at: string | null
          id: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          muted_id?: string
          muter_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      post_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          clicked: boolean | null
          id: string
          post_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          clicked?: boolean | null
          id?: string
          post_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          clicked?: boolean | null
          id?: string
          post_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          brand_id: string | null
          business_id: string | null
          comments_count: number
          content: string
          created_at: string
          hashtags: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          launch_date: string | null
          likes_count: number
          post_type: string | null
          products: Json | null
          rating: number | null
          shares_count: number
          tags: string[] | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          brand_id?: string | null
          business_id?: string | null
          comments_count?: number
          content: string
          created_at?: string
          hashtags?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          launch_date?: string | null
          likes_count?: number
          post_type?: string | null
          products?: Json | null
          rating?: number | null
          shares_count?: number
          tags?: string[] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          brand_id?: string | null
          business_id?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          hashtags?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          launch_date?: string | null
          likes_count?: number
          post_type?: string | null
          products?: Json | null
          rating?: number | null
          shares_count?: number
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          profile_completed: boolean | null
          registration_number: number | null
          telephone: string | null
          updated_at: string
          username: string | null
          wants_booking: boolean | null
          wants_premium: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          interests?: string[] | null
          last_name?: string | null
          profile_completed?: boolean | null
          registration_number?: number | null
          telephone?: string | null
          updated_at?: string
          username?: string | null
          wants_booking?: boolean | null
          wants_premium?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          profile_completed?: boolean | null
          registration_number?: number | null
          telephone?: string | null
          updated_at?: string
          username?: string | null
          wants_booking?: boolean | null
          wants_premium?: boolean | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          event_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requester_id: string
          status: string
          ticket_purchase_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          event_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requester_id: string
          status?: string
          ticket_purchase_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          event_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requester_id?: string
          status?: string
          ticket_purchase_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restricted_customers: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          reason: string | null
          restricted_until: string | null
          restriction_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          reason?: string | null
          restricted_until?: string | null
          restriction_type?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          reason?: string | null
          restricted_until?: string | null
          restriction_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          brand_id: string | null
          business_id: string | null
          content: string
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          staff_member_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          staff_member_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          staff_member_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_styles: {
        Row: {
          created_at: string
          id: string
          style_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          style_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          style_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_styles_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          buffer_time: number
          business_categories: string[] | null
          category_id: string | null
          created_at: string
          currency_code: string | null
          currency_symbol: string | null
          description: string | null
          discount_active: boolean | null
          discount_percentage: number | null
          duration: number
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_active: boolean
          name: string
          original_price: number | null
          price: number
          requirements: string | null
          staff_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buffer_time?: number
          business_categories?: string[] | null
          category_id?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          description?: string | null
          discount_active?: boolean | null
          discount_percentage?: number | null
          duration: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_active?: boolean
          name: string
          original_price?: number | null
          price: number
          requirements?: string | null
          staff_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buffer_time?: number
          business_categories?: string[] | null
          category_id?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          description?: string | null
          discount_active?: boolean | null
          discount_percentage?: number | null
          duration?: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_active?: boolean
          name?: string
          original_price?: number | null
          price?: number
          requirements?: string | null
          staff_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      styles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_price: number | null
          estimated_time: number | null
          id: string
          location: string | null
          photo_url: string
          professional_id: string
          services_required: string[] | null
          style_name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          estimated_time?: number | null
          id?: string
          location?: string | null
          photo_url: string
          professional_id: string
          services_required?: string[] | null
          style_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          estimated_time?: number | null
          id?: string
          location?: string | null
          photo_url?: string
          professional_id?: string
          services_required?: string[] | null
          style_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          bio: string | null
          business_id: string
          email: string
          id: string
          invitation_message: string | null
          invited_at: string
          member_id: string | null
          phone: string | null
          role: string | null
          specialties: string | null
          status: string
          title: string | null
        }
        Insert: {
          accepted_at?: string | null
          bio?: string | null
          business_id: string
          email: string
          id?: string
          invitation_message?: string | null
          invited_at?: string
          member_id?: string | null
          phone?: string | null
          role?: string | null
          specialties?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          accepted_at?: string | null
          bio?: string | null
          business_id?: string
          email?: string
          id?: string
          invitation_message?: string | null
          invited_at?: string
          member_id?: string | null
          phone?: string | null
          role?: string | null
          specialties?: string | null
          status?: string
          title?: string | null
        }
        Relationships: []
      }
      ticket_purchases: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_used: boolean
          purchase_date: string
          purchaser_email: string
          purchaser_id: string
          purchaser_name: string
          qr_code: string
          quantity: number
          refund_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          ticket_type_id: string | null
          total_amount: number
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_used?: boolean
          purchase_date?: string
          purchaser_email: string
          purchaser_id: string
          purchaser_name: string
          qr_code: string
          quantity?: number
          refund_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          ticket_type_id?: string | null
          total_amount: number
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_used?: boolean
          purchase_date?: string
          purchaser_email?: string
          purchaser_id?: string
          purchaser_name?: string
          qr_code?: string
          quantity?: number
          refund_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          ticket_type_id?: string | null
          total_amount?: number
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_purchases_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          requested_date: string
          requested_time: string
          services: Json
          special_requests: string | null
          staff_member_id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          requested_date: string
          requested_time: string
          services: Json
          special_requests?: string | null
          staff_member_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          requested_date?: string
          requested_time?: string
          services?: Json
          special_requests?: string | null
          staff_member_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          interests: string[] | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          interests?: string[] | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          interests?: string[] | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_complete_arrived_appointments: { Args: never; Returns: undefined }
      cancel_customer_appointment: {
        Args: { p_appointment_id: string; p_reason?: string | null }
        Returns: undefined
      }
      cleanup_expired_cart_items: { Args: never; Returns: undefined }
      get_staff_busy_slots: {
        Args: {
          p_business_id: string
          p_staff_auth_id: string | null
          p_range_start: string
          p_range_end: string
        }
        Returns: {
          start_time: string
          end_time: string
        }[]
      }
      create_conversation_with_participants: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: string
      }
      decrement_ticket_count: {
        Args: { amount: number; ticket_id: string }
        Returns: undefined
      }
      get_featured_resumes: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          display_count: number
          first_name: string
          id: string
          last_displayed_at: string
          linkedin_url: string
          resume_url: string
          title: string
        }[]
      }
      get_user_account_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["account_type"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_business_stats: {
        Args: { biz_id: string; cust_id: string }
        Returns: undefined
      }
      increment_staff_stats: {
        Args: { biz_id: string; staff_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_moderator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_type: "individual" | "brand" | "business" | "charitable_partner"
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
      account_type: ["individual", "brand", "business", "charitable_partner"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
