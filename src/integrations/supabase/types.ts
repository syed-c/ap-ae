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
      ai_errors: {
        Row: {
          context_data: Json | null
          created_at: string
          error_code: string | null
          error_message: string | null
          event_id: string | null
          id: string
          resolved: boolean
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          resolved?: boolean
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          resolved?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_errors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ai_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_events: {
        Row: {
          clinic_id: string | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          event_type: string
          id: string
          module: string
          status: string
          triggered_by: string
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          event_type: string
          id?: string
          module: string
          status?: string
          triggered_by?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          event_type?: string
          id?: string
          module?: string
          status?: string
          triggered_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          action: string
          created_at: string
          event_id: string | null
          feedback_notes: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          event_id?: string | null
          feedback_notes?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          event_id?: string | null
          feedback_notes?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ai_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inputs: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          input_data: Json | null
          input_type: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          input_data?: Json | null
          input_type: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          input_data?: Json | null
          input_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inputs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ai_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_module_settings: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          module: string
          thresholds: Json | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          module: string
          thresholds?: Json | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          module?: string
          thresholds?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_outputs: {
        Row: {
          created_at: string
          event_id: string | null
          explanation: string | null
          id: string
          output_data: Json | null
          output_type: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          explanation?: string | null
          id?: string
          output_data?: Json | null
          output_type: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          explanation?: string | null
          id?: string
          output_data?: Json | null
          output_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_outputs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ai_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          input_schema: Json | null
          is_active: boolean
          module: string
          name: string
          output_schema: Json | null
          prompt_template: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean
          module: string
          name: string
          output_schema?: Json | null
          prompt_template: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean
          module?: string
          name?: string
          output_schema?: Json | null
          prompt_template?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_search_logs: {
        Row: {
          clicked_result_id: string | null
          created_at: string
          extracted_intent: Json | null
          fallback_used: boolean | null
          id: string
          original_query: string | null
          results_count: number | null
          search_duration_ms: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string
          extracted_intent?: Json | null
          fallback_used?: boolean | null
          id?: string
          original_query?: string | null
          results_count?: number | null
          search_duration_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string
          extracted_intent?: Json | null
          fallback_used?: boolean | null
          id?: string
          original_query?: string | null
          results_count?: number | null
          search_duration_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_search_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      appointment_types: {
        Row: {
          clinic_id: string | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          price_from: number | null
          price_to: number | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          admin_notes: string | null
          booking_page_path: string | null
          booking_session_id: string | null
          clinic_id: string | null
          confirmed_date: string | null
          confirmed_time: string | null
          created_at: string
          dentist_id: string | null
          end_datetime: string | null
          id: string
          is_assigned: boolean | null
          is_disputed: boolean
          lead_id: string | null
          manage_token: string | null
          notes: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string
          preferred_date: string | null
          preferred_time: string | null
          source: string
          start_datetime: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_page_path?: string | null
          booking_session_id?: string | null
          clinic_id?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          created_at?: string
          dentist_id?: string | null
          end_datetime?: string | null
          id?: string
          is_assigned?: boolean | null
          is_disputed?: boolean
          lead_id?: string | null
          manage_token?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          source?: string
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_page_path?: string | null
          booking_session_id?: string | null
          clinic_id?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          created_at?: string
          dentist_id?: string | null
          end_datetime?: string | null
          id?: string
          is_assigned?: boolean | null
          is_disputed?: boolean
          lead_id?: string | null
          manage_token?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          source?: string
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          city_id: string
          created_at: string
          dentist_count: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          dentist_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          dentist_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          created_at: string
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          rule_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_enabled: boolean | null
          last_run_at: string | null
          name: string
          rule_type: string | null
          run_count: number
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_enabled?: boolean | null
          last_run_at?: string | null
          name: string
          rule_type?: string | null
          run_count?: number
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_enabled?: boolean | null
          last_run_at?: string | null
          name?: string
          rule_type?: string | null
          run_count?: number
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      availability_blocks: {
        Row: {
          block_type: string | null
          clinic_id: string
          created_at: string
          end_datetime: string
          id: string
          reason: string | null
          start_datetime: string
        }
        Insert: {
          block_type?: string | null
          clinic_id: string
          created_at?: string
          end_datetime: string
          id?: string
          reason?: string | null
          start_datetime: string
        }
        Update: {
          block_type?: string | null
          clinic_id?: string
          created_at?: string
          end_datetime?: string
          id?: string
          reason?: string | null
          start_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          post_count: number | null
          role: string | null
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          post_count?: number | null
          role?: string | null
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          post_count?: number | null
          role?: string | null
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          post_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          post_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          post_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_content_templates: {
        Row: {
          category: string
          content_structure: Json
          created_at: string
          description: string | null
          example_titles: string[] | null
          id: string
          is_active: boolean | null
          name: string
          seo_guidelines: string | null
          target_word_count: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string
          content_structure?: Json
          created_at?: string
          description?: string | null
          example_titles?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          seo_guidelines?: string | null
          target_word_count?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          content_structure?: Json
          created_at?: string
          description?: string | null
          example_titles?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          seo_guidelines?: string | null
          target_word_count?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_topic_clusters: {
        Row: {
          cluster_name: string
          created_at: string
          id: string
          intent_type: string | null
          pillar_page_slug: string | null
          primary_keyword: string
          related_keywords: string[] | null
          updated_at: string
        }
        Insert: {
          cluster_name: string
          created_at?: string
          id?: string
          intent_type?: string | null
          pillar_page_slug?: string | null
          primary_keyword: string
          related_keywords?: string[] | null
          updated_at?: string
        }
        Update: {
          cluster_name?: string
          created_at?: string
          id?: string
          intent_type?: string | null
          pillar_page_slug?: string | null
          primary_keyword?: string
          related_keywords?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_notifications: {
        Row: {
          appointment_id: string | null
          clinic_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          title: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_ranges: {
        Row: {
          created_at: string
          currency: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          max_value: number | null
          min_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          max_value?: number | null
          min_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          max_value?: number | null
          min_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country: string
          country_id: string | null
          created_at: string
          dentist_count: number
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          seo_status: string | null
          slug: string
          state_id: string | null
          updated_at: string
        }
        Insert: {
          country?: string
          country_id?: string | null
          created_at?: string
          dentist_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          seo_status?: string | null
          slug: string
          state_id?: string | null
          updated_at?: string
        }
        Update: {
          country?: string
          country_id?: string | null
          created_at?: string
          dentist_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          seo_status?: string | null
          slug?: string
          state_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          admin_notes: string | null
          business_email: string | null
          business_phone: string | null
          clinic_id: string
          created_at: string
          documents: Json | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
          verification_expires_at: string | null
          verification_method: string | null
          verification_sent_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_email?: string | null
          business_phone?: string | null
          clinic_id: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_method?: string | null
          verification_sent_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_email?: string | null
          business_phone?: string | null
          clinic_id?: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_method?: string | null
          verification_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_automation_settings: {
        Row: {
          auto_review_request: boolean
          clinic_id: string
          created_at: string
          daily_message_limit: number | null
          followup_enabled: boolean | null
          id: string
          is_messaging_enabled: boolean
          reminder_1_day: boolean
          reminder_2_days: boolean | null
          reminder_3_hours: boolean | null
          reminder_7_day: boolean
          reminder_channel: string | null
          review_request_enabled: boolean | null
          updated_at: string
          welcome_message_enabled: boolean
        }
        Insert: {
          auto_review_request?: boolean
          clinic_id: string
          created_at?: string
          daily_message_limit?: number | null
          followup_enabled?: boolean | null
          id?: string
          is_messaging_enabled?: boolean
          reminder_1_day?: boolean
          reminder_2_days?: boolean | null
          reminder_3_hours?: boolean | null
          reminder_7_day?: boolean
          reminder_channel?: string | null
          review_request_enabled?: boolean | null
          updated_at?: string
          welcome_message_enabled?: boolean
        }
        Update: {
          auto_review_request?: boolean
          clinic_id?: string
          created_at?: string
          daily_message_limit?: number | null
          followup_enabled?: boolean | null
          id?: string
          is_messaging_enabled?: boolean
          reminder_1_day?: boolean
          reminder_2_days?: boolean | null
          reminder_3_hours?: boolean | null
          reminder_7_day?: boolean
          reminder_channel?: string | null
          review_request_enabled?: boolean | null
          updated_at?: string
          welcome_message_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "clinic_automation_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_hours: {
        Row: {
          clinic_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string | null
        }
        Insert: {
          clinic_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
        }
        Update: {
          clinic_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_hours_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          clinic_id: string
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_cover: boolean | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          clinic_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_cover?: boolean | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          clinic_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_cover?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_insurances: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          insurance_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          insurance_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          insurance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_insurances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_insurances_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_messages: {
        Row: {
          channel: string
          clinic_id: string
          content: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          message_content: string | null
          metadata: Json | null
          patient_id: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          template_type: string | null
        }
        Insert: {
          channel?: string
          clinic_id: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          patient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          template_type?: string | null
        }
        Update: {
          channel?: string
          clinic_id?: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          patient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          template_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_oauth_tokens: {
        Row: {
          access_token: string | null
          clinic_id: string
          created_at: string
          gmb_booking_link_enabled: boolean | null
          gmb_booking_link_id: string | null
          gmb_booking_link_set_at: string | null
          gmb_connected: boolean | null
          gmb_data: Json | null
          gmb_last_sync_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          clinic_id: string
          created_at?: string
          gmb_booking_link_enabled?: boolean | null
          gmb_booking_link_id?: string | null
          gmb_booking_link_set_at?: string | null
          gmb_connected?: boolean | null
          gmb_data?: Json | null
          gmb_last_sync_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          clinic_id?: string
          created_at?: string
          gmb_booking_link_enabled?: boolean | null
          gmb_booking_link_id?: string | null
          gmb_booking_link_set_at?: string | null
          gmb_connected?: boolean | null
          gmb_data?: Json | null
          gmb_last_sync_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_oauth_tokens_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_subscriptions: {
        Row: {
          amount_paid: number | null
          billing_cycle: string | null
          cancelled_at: string | null
          clinic_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_manual_override: boolean
          next_billing_date: string | null
          override_by: string | null
          override_reason: string | null
          payment_method: string | null
          payment_reference: string | null
          plan_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          clinic_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_manual_override?: boolean
          next_billing_date?: string | null
          override_by?: string | null
          override_reason?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          clinic_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_manual_override?: boolean
          next_billing_date?: string | null
          override_by?: string | null
          override_reason?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_treatments: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          price_aed: number | null
          price_from: number | null
          price_to: number | null
          treatment_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          price_aed?: number | null
          price_from?: number | null
          price_to?: number | null
          treatment_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          price_aed?: number | null
          price_from?: number | null
          price_to?: number | null
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          area_id: string | null
          average_rating: number
          city_id: string | null
          claim_status: Database["public"]["Enums"]["claim_status"]
          claimed_at: string | null
          claimed_by: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          duplicate_group_id: string | null
          email: string | null
          gmb_connected: boolean | null
          gmb_data: Json | null
          google_maps_url: string | null
          google_place_id: string | null
          id: string
          is_active: boolean
          is_active_listing: boolean | null
          is_duplicate: boolean
          is_featured: boolean
          is_suspended: boolean
          latitude: number | null
          location_pending_approval: boolean
          location_verified: boolean
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          photos: Json | null
          rank_score: number
          rating: number
          review_count: number
          seo_visible: boolean
          slug: string
          source: Database["public"]["Enums"]["clinic_source"]
          total_leads: number
          total_reviews: number
          updated_at: string
          verification_expires_at: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area_id?: string | null
          average_rating?: number
          city_id?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_at?: string | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duplicate_group_id?: string | null
          email?: string | null
          gmb_connected?: boolean | null
          gmb_data?: Json | null
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean
          is_active_listing?: boolean | null
          is_duplicate?: boolean
          is_featured?: boolean
          is_suspended?: boolean
          latitude?: number | null
          location_pending_approval?: boolean
          location_verified?: boolean
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          photos?: Json | null
          rank_score?: number
          rating?: number
          review_count?: number
          seo_visible?: boolean
          slug: string
          source?: Database["public"]["Enums"]["clinic_source"]
          total_leads?: number
          total_reviews?: number
          updated_at?: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area_id?: string | null
          average_rating?: number
          city_id?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_at?: string | null
          claimed_by?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duplicate_group_id?: string | null
          email?: string | null
          gmb_connected?: boolean | null
          gmb_data?: Json | null
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean
          is_active_listing?: boolean | null
          is_duplicate?: boolean
          is_featured?: boolean
          is_suspended?: boolean
          latitude?: number | null
          location_pending_approval?: boolean
          location_verified?: boolean
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          photos?: Json | null
          rank_score?: number
          rating?: number
          review_count?: number
          seo_visible?: boolean
          slug?: string
          source?: Database["public"]["Enums"]["clinic_source"]
          total_leads?: number
          total_reviews?: number
          updated_at?: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_pages: {
        Row: {
          city_id_1: string | null
          city_id_2: string | null
          content: string | null
          created_at: string
          h1: string | null
          id: string
          is_indexed: boolean | null
          is_published: boolean | null
          meta_description: string | null
          page_type: string
          slug: string
          state_id_1: string | null
          state_id_2: string | null
          title: string | null
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          city_id_1?: string | null
          city_id_2?: string | null
          content?: string | null
          created_at?: string
          h1?: string | null
          id?: string
          is_indexed?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          page_type: string
          slug: string
          state_id_1?: string | null
          state_id_2?: string | null
          title?: string | null
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          city_id_1?: string | null
          city_id_2?: string | null
          content?: string | null
          created_at?: string
          h1?: string | null
          id?: string
          is_indexed?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          page_type?: string
          slug?: string
          state_id_1?: string | null
          state_id_2?: string | null
          title?: string | null
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_pages_city_id_1_fkey"
            columns: ["city_id_1"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_pages_city_id_2_fkey"
            columns: ["city_id_2"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_pages_state_id_1_fkey"
            columns: ["state_id_1"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_pages_state_id_2_fkey"
            columns: ["state_id_2"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_pages_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          clinic_id: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_numbers: {
        Row: {
          assigned_at: string | null
          clinic_id: string | null
          created_at: string
          id: string
          is_active: boolean
          is_whatsapp_enabled: boolean
          phone_number: string
          provider: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_whatsapp_enabled?: boolean
          phone_number: string
          provider?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_whatsapp_enabled?: boolean
          phone_number?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_numbers_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_availability_rules: {
        Row: {
          break_end: string | null
          break_start: string | null
          buffer_minutes: number | null
          clinic_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          slot_duration_minutes: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          buffer_minutes?: number | null
          clinic_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number | null
          start_time?: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          buffer_minutes?: number | null
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_availability_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_settings: {
        Row: {
          allow_guest_booking: boolean | null
          allow_same_day_booking: boolean | null
          auto_confirm: boolean | null
          booking_enabled: boolean | null
          booking_notes: string | null
          booking_require_approval: boolean | null
          cancellation_policy: string | null
          clinic_id: string
          confirmation_email_enabled: boolean | null
          created_at: string
          id: string
          max_advance_booking_days: number | null
          min_advance_booking_hours: number | null
          notification_cancellation: boolean | null
          notification_channel_dashboard: boolean | null
          notification_channel_email: boolean | null
          notification_channel_whatsapp: boolean | null
          notification_email: string | null
          notification_email_secondary: string | null
          notification_form_submission: boolean | null
          notification_message: boolean | null
          notification_new_appointment: boolean | null
          notification_phone: string | null
          notification_whatsapp_number: string | null
          reminder_hours_before: number | null
          reminder_sms_enabled: boolean | null
          settings: Json | null
          updated_at: string
          user_id: string | null
          working_hours: Json | null
        }
        Insert: {
          allow_guest_booking?: boolean | null
          allow_same_day_booking?: boolean | null
          auto_confirm?: boolean | null
          booking_enabled?: boolean | null
          booking_notes?: string | null
          booking_require_approval?: boolean | null
          cancellation_policy?: string | null
          clinic_id: string
          confirmation_email_enabled?: boolean | null
          created_at?: string
          id?: string
          max_advance_booking_days?: number | null
          min_advance_booking_hours?: number | null
          notification_cancellation?: boolean | null
          notification_channel_dashboard?: boolean | null
          notification_channel_email?: boolean | null
          notification_channel_whatsapp?: boolean | null
          notification_email?: string | null
          notification_email_secondary?: string | null
          notification_form_submission?: boolean | null
          notification_message?: boolean | null
          notification_new_appointment?: boolean | null
          notification_phone?: string | null
          notification_whatsapp_number?: string | null
          reminder_hours_before?: number | null
          reminder_sms_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
          working_hours?: Json | null
        }
        Update: {
          allow_guest_booking?: boolean | null
          allow_same_day_booking?: boolean | null
          auto_confirm?: boolean | null
          booking_enabled?: boolean | null
          booking_notes?: string | null
          booking_require_approval?: boolean | null
          cancellation_policy?: string | null
          clinic_id?: string
          confirmation_email_enabled?: boolean | null
          created_at?: string
          id?: string
          max_advance_booking_days?: number | null
          min_advance_booking_hours?: number | null
          notification_cancellation?: boolean | null
          notification_channel_dashboard?: boolean | null
          notification_channel_email?: boolean | null
          notification_channel_whatsapp?: boolean | null
          notification_email?: string | null
          notification_email_secondary?: string | null
          notification_form_submission?: boolean | null
          notification_message?: boolean | null
          notification_new_appointment?: boolean | null
          notification_phone?: string | null
          notification_whatsapp_number?: string | null
          reminder_hours_before?: number | null
          reminder_sms_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dentist_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dentists: {
        Row: {
          average_rating: number
          bio: string | null
          clinic_id: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          gender: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          is_primary: boolean | null
          languages: string[] | null
          name: string
          phone: string | null
          photo_url: string | null
          professional_type: string | null
          qualifications: string[] | null
          rating: number | null
          review_count: number | null
          slug: string
          specializations: string[] | null
          title: string | null
          total_reviews: number
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number
          bio?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_primary?: boolean | null
          languages?: string[] | null
          name: string
          phone?: string | null
          photo_url?: string | null
          professional_type?: string | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          slug: string
          specializations?: string[] | null
          title?: string | null
          total_reviews?: number
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          average_rating?: number
          bio?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_primary?: boolean | null
          languages?: string[] | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          professional_type?: string | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          specializations?: string[] | null
          title?: string | null
          total_reviews?: number
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dentists_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      district_assignments: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      editorial_calendar: {
        Row: {
          assigned_to: string | null
          content_type: string | null
          created_at: string
          id: string
          notes: string | null
          priority: string | null
          published_date: string | null
          scheduled_date: string | null
          secondary_keywords: string[] | null
          slug: string | null
          status: string
          target_keyword: string | null
          target_word_count: number | null
          template_id: string | null
          title: string
          topic_cluster_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          secondary_keywords?: string[] | null
          slug?: string | null
          status?: string
          target_keyword?: string | null
          target_word_count?: number | null
          template_id?: string | null
          title: string
          topic_cluster_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          secondary_keywords?: string[] | null
          slug?: string | null
          status?: string
          target_keyword?: string | null
          target_word_count?: number | null
          template_id?: string | null
          title?: string
          topic_cluster_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_calendar_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "blog_content_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_calendar_topic_cluster_id_fkey"
            columns: ["topic_cluster_id"]
            isOneToOne: false
            referencedRelation: "blog_topic_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      email_enrichment_results: {
        Row: {
          applied_at: string | null
          clinic_id: string
          created_at: string
          email_selected: string | null
          emails_found: string[] | null
          error_message: string | null
          found_email: string | null
          id: string
          match_confidence: number | null
          match_method: string | null
          needs_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string
          source: string | null
          status: string | null
          website_url: string | null
        }
        Insert: {
          applied_at?: string | null
          clinic_id: string
          created_at?: string
          email_selected?: string | null
          emails_found?: string[] | null
          error_message?: string | null
          found_email?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          needs_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id: string
          source?: string | null
          status?: string | null
          website_url?: string | null
        }
        Update: {
          applied_at?: string | null
          clinic_id?: string
          created_at?: string
          email_selected?: string | null
          emails_found?: string[] | null
          error_message?: string | null
          found_email?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          needs_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string
          source?: string | null
          status?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_enrichment_results_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_enrichment_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "email_enrichment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_enrichment_sessions: {
        Row: {
          city_id: string | null
          completed_at: string | null
          created_at: string
          errors: number | null
          failed_count: number | null
          found_emails: number | null
          id: string
          needs_review_count: number | null
          processed: number | null
          processed_count: number | null
          skipped_count: number | null
          state_id: string | null
          status: string
          success_count: number | null
          total_to_process: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city_id?: string | null
          completed_at?: string | null
          created_at?: string
          errors?: number | null
          failed_count?: number | null
          found_emails?: number | null
          id?: string
          needs_review_count?: number | null
          processed?: number | null
          processed_count?: number | null
          skipped_count?: number | null
          state_id?: string | null
          status?: string
          success_count?: number | null
          total_to_process?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city_id?: string | null
          completed_at?: string | null
          created_at?: string
          errors?: number | null
          failed_count?: number | null
          found_emails?: number | null
          id?: string
          needs_review_count?: number | null
          processed?: number | null
          processed_count?: number | null
          skipped_count?: number | null
          state_id?: string | null
          status?: string
          success_count?: number | null
          total_to_process?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_enrichment_sessions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_enrichment_sessions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          plain_content: string | null
          slug: string
          subject: string
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          plain_content?: string | null
          slug: string
          subject: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          plain_content?: string | null
          slug?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      feature_registry: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          feature_key: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          feature_key: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          feature_key?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      form_workflow_settings: {
        Row: {
          capture_ip_address: boolean | null
          clinic_id: string | null
          created_at: string
          delivery_destinations: Json | null
          form_sequence: Json | null
          id: string
          is_active: boolean | null
          name: string
          require_otp_verification: boolean | null
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          capture_ip_address?: boolean | null
          clinic_id?: string | null
          created_at?: string
          delivery_destinations?: Json | null
          form_sequence?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          require_otp_verification?: boolean | null
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          capture_ip_address?: boolean | null
          clinic_id?: string | null
          created_at?: string
          delivery_destinations?: Json | null
          form_sequence?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          require_otp_verification?: boolean | null
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_workflow_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      gmb_link_requests: {
        Row: {
          clinic_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          initiated_by: string
          status: string | null
          token: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          initiated_by: string
          status?: string | null
          token?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          initiated_by?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmb_link_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_scraper_results: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          error_message: string | null
          id: string
          import_status: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          place_id: string | null
          rating: number | null
          raw_data: Json | null
          review_count: number | null
          session_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          import_status?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          session_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          import_status?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          session_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gmb_scraper_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gmb_scraper_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_scraper_sessions: {
        Row: {
          categories: string[] | null
          city_ids: string[] | null
          created_at: string
          duplicate_count: number | null
          duplicates: number | null
          errors: number | null
          id: string
          imported: number | null
          imported_count: number | null
          state_id: string | null
          state_name: string | null
          status: string
          total_found: number | null
          total_results: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          city_ids?: string[] | null
          created_at?: string
          duplicate_count?: number | null
          duplicates?: number | null
          errors?: number | null
          id?: string
          imported?: number | null
          imported_count?: number | null
          state_id?: string | null
          state_name?: string | null
          status?: string
          total_found?: number | null
          total_results?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          city_ids?: string[] | null
          created_at?: string
          duplicate_count?: number | null
          duplicates?: number | null
          errors?: number | null
          id?: string
          imported?: number | null
          imported_count?: number | null
          state_id?: string | null
          state_name?: string | null
          status?: string
          total_found?: number | null
          total_results?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gmb_scraper_sessions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          gmb_connected: boolean | null
          google_email: string | null
          id: string
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          gmb_connected?: boolean | null
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          gmb_connected?: boolean | null
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_reviews: {
        Row: {
          author_name: string | null
          author_photo_url: string | null
          clinic_id: string
          comment: string | null
          created_at: string
          google_review_id: string | null
          id: string
          rating: number | null
          reply: string | null
          reply_status: string | null
          reply_text: string | null
          review_time: string | null
          reviewer_name: string | null
          reviewer_photo_url: string | null
          synced_at: string | null
          text_content: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          author_photo_url?: string | null
          clinic_id: string
          comment?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          rating?: number | null
          reply?: string | null
          reply_status?: string | null
          reply_text?: string | null
          review_time?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          synced_at?: string | null
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          author_photo_url?: string | null
          clinic_id?: string
          comment?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          rating?: number | null
          reply?: string | null
          reply_status?: string | null
          reply_text?: string | null
          review_time?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          synced_at?: string | null
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_service_coverage: {
        Row: {
          coverage_notes: string | null
          coverage_percentage: number | null
          created_at: string
          id: string
          insurance_id: string
          is_active: boolean | null
          is_covered: boolean | null
          max_claim_aed: number | null
          treatment_id: string
          updated_at: string
          waiting_period_days: number | null
        }
        Insert: {
          coverage_notes?: string | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          insurance_id: string
          is_active?: boolean | null
          is_covered?: boolean | null
          max_claim_aed?: number | null
          treatment_id: string
          updated_at?: string
          waiting_period_days?: number | null
        }
        Update: {
          coverage_notes?: string | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          insurance_id?: string
          is_active?: boolean | null
          is_covered?: boolean | null
          max_claim_aed?: number | null
          treatment_id?: string
          updated_at?: string
          waiting_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_service_coverage_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_service_coverage_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          coverage_notes: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          insurance_type: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string | null
          verification_required: boolean | null
        }
        Insert: {
          coverage_notes?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          insurance_type?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string | null
          verification_required?: boolean | null
        }
        Update: {
          coverage_notes?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          insurance_type?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string | null
          verification_required?: boolean | null
        }
        Relationships: []
      }
      intake_form_templates: {
        Row: {
          clinic_id: string | null
          created_at: string
          description: string | null
          fields: Json | null
          form_type: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json | null
          form_type?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          fields?: Json | null
          form_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_form_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_reviews: {
        Row: {
          ai_suggested_reply: string | null
          clinic_id: string | null
          comment: string | null
          content: string | null
          created_at: string
          dentist_id: string | null
          fake_review_reason: string | null
          hipaa_flagged: boolean | null
          id: string
          initial_sentiment:
            | Database["public"]["Enums"]["review_sentiment"]
            | null
          is_fake_suspected: boolean | null
          is_featured: boolean
          is_verified_patient: boolean
          moderated_at: string | null
          moderated_by: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          rating: number | null
          rejection_reason: string | null
          source: string
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_suggested_reply?: string | null
          clinic_id?: string | null
          comment?: string | null
          content?: string | null
          created_at?: string
          dentist_id?: string | null
          fake_review_reason?: string | null
          hipaa_flagged?: boolean | null
          id?: string
          initial_sentiment?:
            | Database["public"]["Enums"]["review_sentiment"]
            | null
          is_fake_suspected?: boolean | null
          is_featured?: boolean
          is_verified_patient?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          rating?: number | null
          rejection_reason?: string | null
          source?: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_suggested_reply?: string | null
          clinic_id?: string | null
          comment?: string | null
          content?: string | null
          created_at?: string
          dentist_id?: string | null
          fake_review_reason?: string | null
          hipaa_flagged?: boolean | null
          id?: string
          initial_sentiment?:
            | Database["public"]["Enums"]["review_sentiment"]
            | null
          is_fake_suspected?: boolean | null
          is_featured?: boolean
          is_verified_patient?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          rating?: number | null
          rejection_reason?: string | null
          source?: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_reviews_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_quotas: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          leads_used: number
          period_end: string
          period_start: string
          plan_id: string | null
          quota_limit: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          leads_used?: number
          period_end?: string
          period_start?: string
          plan_id?: string | null
          quota_limit?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          leads_used?: number
          period_end?: string
          period_start?: string
          plan_id?: string | null
          quota_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_quotas_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_quotas_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          clinic_id: string | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          dentist_id: string | null
          id: string
          is_spam: boolean
          message: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          treatment_id: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clinic_id?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          is_spam?: boolean
          message?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          treatment_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clinic_id?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          is_spam?: boolean
          message?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          treatment_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_templates: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      outreach_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          max_sends_per_clinic: number | null
          max_sends_per_day: number | null
          name: string
          schedule_config: Json | null
          status: string | null
          target_filter: Json | null
          template_id: string | null
          total_clicked: number | null
          total_opened: number | null
          total_replied: number | null
          total_sent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          max_sends_per_clinic?: number | null
          max_sends_per_day?: number | null
          name: string
          schedule_config?: Json | null
          status?: string | null
          target_filter?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          max_sends_per_clinic?: number | null
          max_sends_per_day?: number | null
          name?: string
          schedule_config?: Json | null
          status?: string | null
          target_filter?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sends: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          clinic_id: string | null
          created_at: string
          email: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sends_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          body_content: string | null
          content: Json | null
          created_at: string
          cta_button_text: string | null
          cta_button_url: string | null
          cta_text: string | null
          faqs: Json | null
          featured_image: string | null
          gallery_images: string[] | null
          h1: string | null
          hero_image: string | null
          hero_intro: string | null
          hero_stats: Json | null
          hero_subtitle: string | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          noindex: boolean | null
          og_image: string | null
          page_slug: string
          page_type: string | null
          reference_id: string | null
          section_1_content: string | null
          section_1_title: string | null
          section_2_content: string | null
          section_2_title: string | null
          section_3_content: string | null
          section_3_title: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body_content?: string | null
          content?: Json | null
          created_at?: string
          cta_button_text?: string | null
          cta_button_url?: string | null
          cta_text?: string | null
          faqs?: Json | null
          featured_image?: string | null
          gallery_images?: string[] | null
          h1?: string | null
          hero_image?: string | null
          hero_intro?: string | null
          hero_stats?: Json | null
          hero_subtitle?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean | null
          og_image?: string | null
          page_slug: string
          page_type?: string | null
          reference_id?: string | null
          section_1_content?: string | null
          section_1_title?: string | null
          section_2_content?: string | null
          section_2_title?: string | null
          section_3_content?: string | null
          section_3_title?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body_content?: string | null
          content?: Json | null
          created_at?: string
          cta_button_text?: string | null
          cta_button_url?: string | null
          cta_text?: string | null
          faqs?: Json | null
          featured_image?: string | null
          gallery_images?: string[] | null
          h1?: string | null
          hero_image?: string | null
          hero_intro?: string | null
          hero_stats?: Json | null
          hero_subtitle?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean | null
          og_image?: string | null
          page_slug?: string
          page_type?: string | null
          reference_id?: string | null
          section_1_content?: string | null
          section_1_title?: string | null
          section_2_content?: string | null
          section_2_title?: string | null
          section_3_content?: string | null
          section_3_title?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          city_slug: string | null
          clinic_id: string | null
          created_at: string
          dentist_id: string | null
          entity_id: string | null
          exit_page: boolean | null
          id: string
          page_path: string | null
          page_title: string | null
          page_type: string | null
          page_url: string | null
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string | null
          state_slug: string | null
          time_on_page_seconds: number | null
          treatment_slug: string | null
          user_agent: string | null
          viewed_at: string
          visitor_id: string | null
          visitor_session_id: string | null
        }
        Insert: {
          city_slug?: string | null
          clinic_id?: string | null
          created_at?: string
          dentist_id?: string | null
          entity_id?: string | null
          exit_page?: boolean | null
          id?: string
          page_path?: string | null
          page_title?: string | null
          page_type?: string | null
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          state_slug?: string | null
          time_on_page_seconds?: number | null
          treatment_slug?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
          visitor_session_id?: string | null
        }
        Update: {
          city_slug?: string | null
          clinic_id?: string | null
          created_at?: string
          dentist_id?: string | null
          entity_id?: string | null
          exit_page?: boolean | null
          id?: string
          page_path?: string | null
          page_title?: string | null
          page_type?: string | null
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          state_slug?: string | null
          time_on_page_seconds?: number | null
          treatment_slug?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
          visitor_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_form_submissions: {
        Row: {
          access_token: string | null
          clinic_id: string | null
          created_at: string
          form_data: Json | null
          id: string
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          status: string | null
          submitted_at: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          clinic_id?: string | null
          created_at?: string
          form_data?: Json | null
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          status?: string | null
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          clinic_id?: string | null
          created_at?: string
          form_data?: Json | null
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          status?: string | null
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_form_submissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_form_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "intake_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          clinic_id: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          first_visit_at: string | null
          id: string
          insurance_member_id: string | null
          insurance_provider: string | null
          is_deleted_by_dentist: boolean | null
          is_opted_in_sms: boolean | null
          is_opted_in_whatsapp: boolean | null
          last_visit_at: string | null
          medical_notes: string | null
          name: string
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          source: string | null
          total_visits: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          clinic_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_visit_at?: string | null
          id?: string
          insurance_member_id?: string | null
          insurance_provider?: string | null
          is_deleted_by_dentist?: boolean | null
          is_opted_in_sms?: boolean | null
          is_opted_in_whatsapp?: boolean | null
          last_visit_at?: string | null
          medical_notes?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source?: string | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          clinic_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_visit_at?: string | null
          id?: string
          insurance_member_id?: string | null
          insurance_provider?: string | null
          is_deleted_by_dentist?: boolean | null
          is_opted_in_sms?: boolean | null
          is_opted_in_whatsapp?: boolean | null
          last_visit_at?: string | null
          medical_notes?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source?: string | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_areas: {
        Row: {
          area_name: string
          city_id: string
          clinic_id: string
          clinic_id_ref: string | null
          created_at: string
          id: string
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          suggested_name: string | null
          suggested_slug: string | null
        }
        Insert: {
          area_name: string
          city_id: string
          clinic_id: string
          clinic_id_ref?: string | null
          created_at?: string
          id?: string
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          suggested_name?: string | null
          suggested_slug?: string | null
        }
        Update: {
          area_name?: string
          city_id?: string
          clinic_id?: string
          clinic_id_ref?: string | null
          created_at?: string
          id?: string
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          suggested_name?: string | null
          suggested_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_areas_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_areas_clinic_id_ref_fkey"
            columns: ["clinic_id_ref"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_clinics: {
        Row: {
          area_id: string | null
          city_id: string | null
          clinic_id: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          area_id?: string | null
          city_id?: string | null
          clinic_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          area_id?: string | null
          city_id?: string | null
          clinic_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pinned_clinics_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_clinics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_clinics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          plan_id: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          plan_id: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      platform_notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          action_url: string | null
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          role: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          role?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          role?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profile_analytics: {
        Row: {
          clinic_id: string | null
          created_at: string
          event_type: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          period_end: string | null
          period_start: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_analytics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_verifications: {
        Row: {
          clinic_id: string | null
          contact_info: string | null
          created_at: string
          dentist_id: string | null
          documents: Json | null
          expires_at: string | null
          id: string
          notes: string | null
          sent_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string | null
          verification_code: string | null
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          contact_info?: string | null
          created_at?: string
          dentist_id?: string | null
          documents?: Json | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code?: string | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          contact_info?: string | null
          created_at?: string
          dentist_id?: string | null
          documents?: Json | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code?: string | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_verifications_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_kpis: {
        Row: {
          clinic_id: string | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_kpis_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      review_clicks: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_clicks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      review_funnel_events: {
        Row: {
          clinic_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          rating: number | null
          review_request_id: string | null
          source: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          rating?: number | null
          review_request_id?: string | null
          source?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          rating?: number | null
          review_request_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_funnel_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_funnel_events_review_request_id_fkey"
            columns: ["review_request_id"]
            isOneToOne: false
            referencedRelation: "review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          channel: string | null
          clinic_id: string
          completed_at: string | null
          created_at: string
          id: string
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          recipient_name: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string | null
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string | null
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          name: string
          permissions: Json | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      schema_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_content_versions: {
        Row: {
          change_reason: string | null
          change_source: string | null
          content: string | null
          created_at: string
          created_by: string | null
          faq: Json | null
          generated_by: string | null
          h1: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          meta_description: string | null
          meta_title: string | null
          quality_score: number | null
          seo_page_id: string | null
          seo_score: number | null
          title: string | null
          version_number: number | null
          word_count: number | null
        }
        Insert: {
          change_reason?: string | null
          change_source?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          faq?: Json | null
          generated_by?: string | null
          h1?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          quality_score?: number | null
          seo_page_id?: string | null
          seo_score?: number | null
          title?: string | null
          version_number?: number | null
          word_count?: number | null
        }
        Update: {
          change_reason?: string | null
          change_source?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          faq?: Json | null
          generated_by?: string | null
          h1?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          quality_score?: number | null
          seo_page_id?: string | null
          seo_score?: number | null
          title?: string | null
          version_number?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_content_versions_seo_page_id_fkey"
            columns: ["seo_page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_fix_job_items: {
        Row: {
          after_score: number | null
          after_snapshot: Json | null
          applied_at: string | null
          before_score: number | null
          before_snapshot: Json | null
          changes_summary: string | null
          created_at: string
          error_message: string | null
          id: string
          is_applied: boolean | null
          is_rolled_back: boolean | null
          job_id: string
          new_content: string | null
          old_content: string | null
          page_slug: string | null
          page_type: string | null
          quality_score: number | null
          seo_page_id: string | null
          status: string
          updated_at: string
          word_count_after: number | null
          word_count_before: number | null
        }
        Insert: {
          after_score?: number | null
          after_snapshot?: Json | null
          applied_at?: string | null
          before_score?: number | null
          before_snapshot?: Json | null
          changes_summary?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_applied?: boolean | null
          is_rolled_back?: boolean | null
          job_id: string
          new_content?: string | null
          old_content?: string | null
          page_slug?: string | null
          page_type?: string | null
          quality_score?: number | null
          seo_page_id?: string | null
          status?: string
          updated_at?: string
          word_count_after?: number | null
          word_count_before?: number | null
        }
        Update: {
          after_score?: number | null
          after_snapshot?: Json | null
          applied_at?: string | null
          before_score?: number | null
          before_snapshot?: Json | null
          changes_summary?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_applied?: boolean | null
          is_rolled_back?: boolean | null
          job_id?: string
          new_content?: string | null
          old_content?: string | null
          page_slug?: string | null
          page_type?: string | null
          quality_score?: number | null
          seo_page_id?: string | null
          status?: string
          updated_at?: string
          word_count_after?: number | null
          word_count_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_fix_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "seo_fix_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_fix_job_items_seo_page_id_fkey"
            columns: ["seo_page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_fix_jobs: {
        Row: {
          apply_mode: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_pages: number | null
          filters: Json | null
          id: string
          job_type: string
          notes: string | null
          processed_pages: number | null
          quality_threshold: number | null
          regeneration_config: Json | null
          started_at: string | null
          status: string
          successful_pages: number | null
          target_word_count: number | null
          total_pages: number | null
          updated_at: string
        }
        Insert: {
          apply_mode?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_pages?: number | null
          filters?: Json | null
          id?: string
          job_type: string
          notes?: string | null
          processed_pages?: number | null
          quality_threshold?: number | null
          regeneration_config?: Json | null
          started_at?: string | null
          status?: string
          successful_pages?: number | null
          target_word_count?: number | null
          total_pages?: number | null
          updated_at?: string
        }
        Update: {
          apply_mode?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_pages?: number | null
          filters?: Json | null
          id?: string
          job_type?: string
          notes?: string | null
          processed_pages?: number | null
          quality_threshold?: number | null
          regeneration_config?: Json | null
          started_at?: string | null
          status?: string
          successful_pages?: number | null
          target_word_count?: number | null
          total_pages?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_metadata_history: {
        Row: {
          batch_id: string | null
          change_reason: string | null
          change_source: string | null
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_h1: string | null
          new_meta_description: string | null
          new_title: string | null
          new_value: string | null
          old_value: string | null
          page_id: string | null
          previous_h1: string | null
          previous_meta_description: string | null
          previous_title: string | null
          reverted_at: string | null
          reverted_by: string | null
          seo_page_id: string | null
          slug: string | null
          status: string | null
        }
        Insert: {
          batch_id?: string | null
          change_reason?: string | null
          change_source?: string | null
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_h1?: string | null
          new_meta_description?: string | null
          new_title?: string | null
          new_value?: string | null
          old_value?: string | null
          page_id?: string | null
          previous_h1?: string | null
          previous_meta_description?: string | null
          previous_title?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          seo_page_id?: string | null
          slug?: string | null
          status?: string | null
        }
        Update: {
          batch_id?: string | null
          change_reason?: string | null
          change_source?: string | null
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_h1?: string | null
          new_meta_description?: string | null
          new_title?: string | null
          new_value?: string | null
          old_value?: string | null
          page_id?: string | null
          previous_h1?: string | null
          previous_meta_description?: string | null
          previous_title?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          seo_page_id?: string | null
          slug?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_metadata_history_seo_page_id_fkey"
            columns: ["seo_page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          ai_sounding_score: number | null
          ai_suggestions: Json | null
          boilerplate_cluster_id: string | null
          canonical_url: string | null
          city_id: string | null
          clinic_id: string | null
          content: string | null
          content_fingerprint: string | null
          created_at: string
          editorial_status: string | null
          faqs: Json | null
          generation_version: number | null
          h1: string | null
          h2_sections: Json | null
          id: string
          identity_score: number | null
          index_block_reason: string | null
          internal_links_intro: string | null
          is_duplicate: boolean
          is_index_worthy: boolean | null
          is_indexed: boolean
          is_optimized: boolean | null
          is_published: boolean
          is_thin_content: boolean
          last_audited_at: string | null
          last_content_edit_source: string | null
          last_crawled_at: string | null
          last_generated_at: string | null
          last_identity_scan_at: string | null
          last_meta_edit_source: string | null
          local_authenticity_score: number | null
          meta_description: string | null
          meta_fingerprint: string | null
          meta_title: string | null
          metadata_hash: string | null
          needs_optimization: boolean | null
          noindex_reason: string | null
          og_description: string | null
          og_title: string | null
          optimized_at: string | null
          page_intent_type: string | null
          page_intro: string | null
          page_type: Database["public"]["Enums"]["seo_page_type"]
          page_value_score: number | null
          published_at: string | null
          rewrite_priority: string | null
          seo_score: number | null
          similar_to_slug: string | null
          similarity_score: number | null
          slug: string
          state_id: string | null
          structure_fingerprint: string | null
          structure_template: number | null
          title: string | null
          treatment_id: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          ai_sounding_score?: number | null
          ai_suggestions?: Json | null
          boilerplate_cluster_id?: string | null
          canonical_url?: string | null
          city_id?: string | null
          clinic_id?: string | null
          content?: string | null
          content_fingerprint?: string | null
          created_at?: string
          editorial_status?: string | null
          faqs?: Json | null
          generation_version?: number | null
          h1?: string | null
          h2_sections?: Json | null
          id?: string
          identity_score?: number | null
          index_block_reason?: string | null
          internal_links_intro?: string | null
          is_duplicate?: boolean
          is_index_worthy?: boolean | null
          is_indexed?: boolean
          is_optimized?: boolean | null
          is_published?: boolean
          is_thin_content?: boolean
          last_audited_at?: string | null
          last_content_edit_source?: string | null
          last_crawled_at?: string | null
          last_generated_at?: string | null
          last_identity_scan_at?: string | null
          last_meta_edit_source?: string | null
          local_authenticity_score?: number | null
          meta_description?: string | null
          meta_fingerprint?: string | null
          meta_title?: string | null
          metadata_hash?: string | null
          needs_optimization?: boolean | null
          noindex_reason?: string | null
          og_description?: string | null
          og_title?: string | null
          optimized_at?: string | null
          page_intent_type?: string | null
          page_intro?: string | null
          page_type: Database["public"]["Enums"]["seo_page_type"]
          page_value_score?: number | null
          published_at?: string | null
          rewrite_priority?: string | null
          seo_score?: number | null
          similar_to_slug?: string | null
          similarity_score?: number | null
          slug: string
          state_id?: string | null
          structure_fingerprint?: string | null
          structure_template?: number | null
          title?: string | null
          treatment_id?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          ai_sounding_score?: number | null
          ai_suggestions?: Json | null
          boilerplate_cluster_id?: string | null
          canonical_url?: string | null
          city_id?: string | null
          clinic_id?: string | null
          content?: string | null
          content_fingerprint?: string | null
          created_at?: string
          editorial_status?: string | null
          faqs?: Json | null
          generation_version?: number | null
          h1?: string | null
          h2_sections?: Json | null
          id?: string
          identity_score?: number | null
          index_block_reason?: string | null
          internal_links_intro?: string | null
          is_duplicate?: boolean
          is_index_worthy?: boolean | null
          is_indexed?: boolean
          is_optimized?: boolean | null
          is_published?: boolean
          is_thin_content?: boolean
          last_audited_at?: string | null
          last_content_edit_source?: string | null
          last_crawled_at?: string | null
          last_generated_at?: string | null
          last_identity_scan_at?: string | null
          last_meta_edit_source?: string | null
          local_authenticity_score?: number | null
          meta_description?: string | null
          meta_fingerprint?: string | null
          meta_title?: string | null
          metadata_hash?: string | null
          needs_optimization?: boolean | null
          noindex_reason?: string | null
          og_description?: string | null
          og_title?: string | null
          optimized_at?: string | null
          page_intent_type?: string | null
          page_intro?: string | null
          page_type?: Database["public"]["Enums"]["seo_page_type"]
          page_value_score?: number | null
          published_at?: string | null
          rewrite_priority?: string | null
          seo_score?: number | null
          similar_to_slug?: string | null
          similarity_score?: number | null
          slug?: string
          state_id?: string | null
          structure_fingerprint?: string | null
          structure_template?: number | null
          title?: string | null
          treatment_id?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_pages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_pages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_pages_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_pages_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          dismissed_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          priority: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_price_ranges: {
        Row: {
          avg_price: number | null
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          notes: string | null
          price_max: number
          price_min: number
          source: string | null
          state_id: string
          treatment_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avg_price?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_max: number
          price_min: number
          source?: string | null
          state_id: string
          treatment_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avg_price?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_max?: number
          price_min?: number
          source?: string | null
          state_id?: string
          treatment_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_price_ranges_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_ranges_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_locks: {
        Row: {
          clinic_id: string | null
          converted_to_appointment_id: string | null
          created_at: string
          end_datetime: string
          expires_at: string
          id: string
          locked_by_user_id: string | null
          start_datetime: string
        }
        Insert: {
          clinic_id?: string | null
          converted_to_appointment_id?: string | null
          created_at?: string
          end_datetime: string
          expires_at: string
          id?: string
          locked_by_user_id?: string | null
          start_datetime: string
        }
        Update: {
          clinic_id?: string | null
          converted_to_appointment_id?: string | null
          created_at?: string
          end_datetime?: string
          expires_at?: string
          id?: string
          locked_by_user_id?: string | null
          start_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_locks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          abbreviation: string
          clinic_count: number
          country_code: string
          created_at: string
          dentist_count: number
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          page_exists: boolean | null
          seo_status: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          abbreviation?: string
          clinic_count?: number
          country_code?: string
          created_at?: string
          dentist_count?: number
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          page_exists?: boolean | null
          seo_status?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          clinic_count?: number
          country_code?: string
          created_at?: string
          dentist_count?: number
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          page_exists?: boolean | null
          seo_status?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      static_page_cache: {
        Row: {
          created_at: string
          generated_at: string | null
          id: string
          is_stale: boolean | null
          page_type: string | null
          path: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          generated_at?: string | null
          id?: string
          is_stale?: boolean | null
          page_type?: string | null
          path: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          generated_at?: string | null
          id?: string
          is_stale?: boolean | null
          page_type?: string | null
          path?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string | null
          created_at: string
          description: string | null
          display_order: number
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price_aed: number
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price_aed?: number
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price_aed?: number
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_reply: boolean | null
          is_internal: boolean | null
          message: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          is_internal?: boolean | null
          message?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          is_internal?: boolean | null
          message?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          clinic_id: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          onboarding_status: string | null
          step_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          onboarding_status?: string | null
          step_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          onboarding_status?: string | null
          step_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          expires_at: string | null
          granted: boolean
          granted_by: string | null
          id: string
          is_granted: boolean | null
          permission: string
          permission_key: string | null
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          is_granted?: boolean | null
          permission: string
          permission_key?: string | null
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          is_granted?: boolean | null
          permission?: string
          permission_key?: string | null
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_tab_permissions: {
        Row: {
          can_access: boolean | null
          created_at: string
          granted_by: string | null
          id: string
          is_enabled: boolean | null
          tab_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean | null
          tab_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean | null
          tab_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          clinic_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          referrer: string | null
          visitor_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          referrer?: string | null
          visitor_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          referrer?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_journeys: {
        Row: {
          appointment_id: string | null
          clinic_id: string | null
          converted: boolean | null
          created_at: string
          dentist_id: string | null
          id: string
          journey_stage: string
          page_path: string
          session_id: string
          step_number: number | null
          visitor_session_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id?: string | null
          converted?: boolean | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          journey_stage: string
          page_path: string
          session_id: string
          step_number?: number | null
          visitor_session_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string | null
          converted?: boolean | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          journey_stage?: string
          page_path?: string
          session_id?: string
          step_number?: number | null
          visitor_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_journeys_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_journeys_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_journeys_visitor_session_id_fkey"
            columns: ["visitor_session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          is_bot: boolean | null
          landing_page: string | null
          last_seen_at: string | null
          linked_at: string | null
          os: string | null
          pages_viewed: number | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          referrer: string | null
          region: string | null
          session_duration_seconds: number | null
          session_end: string | null
          session_id: string | null
          session_start: string | null
          total_events: number | null
          total_pageviews: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_fingerprint: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          landing_page?: string | null
          last_seen_at?: string | null
          linked_at?: string | null
          os?: string | null
          pages_viewed?: number | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          referrer?: string | null
          region?: string | null
          session_duration_seconds?: number | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string | null
          total_events?: number | null
          total_pageviews?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_fingerprint?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          landing_page?: string | null
          last_seen_at?: string | null
          linked_at?: string | null
          os?: string | null
          pages_viewed?: number | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          referrer?: string | null
          region?: string | null
          session_duration_seconds?: number | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string | null
          total_events?: number | null
          total_pageviews?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_fingerprint?: string | null
          visitor_id?: string | null
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
      app_role: "super_admin" | "district_manager" | "dentist" | "patient"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      claim_status: "unclaimed" | "pending" | "claimed"
      clinic_source: "manual" | "gmb" | "import"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
        | "spam"
      review_sentiment: "positive" | "negative"
      review_status: "pending" | "approved" | "rejected"
      seo_page_type:
        | "state"
        | "city"
        | "treatment"
        | "city_treatment"
        | "clinic"
        | "blog"
        | "neighborhood"
        | "service"
        | "service_location"
      subscription_status: "active" | "expired" | "cancelled" | "pending"
      verification_status: "unverified" | "pending" | "verified" | "expired"
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
      app_role: ["super_admin", "district_manager", "dentist", "patient"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      claim_status: ["unclaimed", "pending", "claimed"],
      clinic_source: ["manual", "gmb", "import"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
        "spam",
      ],
      review_sentiment: ["positive", "negative"],
      review_status: ["pending", "approved", "rejected"],
      seo_page_type: [
        "state",
        "city",
        "treatment",
        "city_treatment",
        "clinic",
        "blog",
        "neighborhood",
        "service",
        "service_location",
      ],
      subscription_status: ["active", "expired", "cancelled", "pending"],
      verification_status: ["unverified", "pending", "verified", "expired"],
    },
  },
} as const
