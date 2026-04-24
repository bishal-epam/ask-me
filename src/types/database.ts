export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          persona_id: string
          reviewed_at: string | null
          session_metadata: Json
          updated_at: string
          visitor_email: string | null
          visitor_id: string | null
          visitor_name: string | null
          visitor_purpose: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          persona_id: string
          reviewed_at?: string | null
          session_metadata?: Json
          updated_at?: string
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_purpose?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          persona_id?: string
          reviewed_at?: string | null
          session_metadata?: Json
          updated_at?: string
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          persona_id: string
          requester_email: string
          requester_name: string
          requester_org: string | null
          session_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          persona_id: string
          requester_email: string
          requester_name: string
          requester_org?: string | null
          session_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          persona_id?: string
          requester_email?: string
          requester_name?: string
          requester_org?: string | null
          session_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          persona_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          persona_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          persona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_count: number
          content: string | null
          created_at: string
          doc_type: string
          error_message: string | null
          file_url: string | null
          id: string
          metadata: Json
          name: string
          original_name: string
          persona_id: string
          pipeline_stage: string
          profile_id: string
          status: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          chunk_count?: number
          content?: string | null
          created_at?: string
          doc_type?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json
          name: string
          original_name: string
          persona_id: string
          pipeline_stage?: string
          profile_id: string
          status?: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          chunk_count?: number
          content?: string | null
          created_at?: string
          doc_type?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json
          name?: string
          original_name?: string
          persona_id?: string
          pipeline_stage?: string
          profile_id?: string
          status?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_logs: {
        Row: {
          confidence: number
          created_at: string
          flags: string[]
          id: string
          message_snippet: string | null
          persona_id: string
          session_id: string | null
        }
        Insert: {
          confidence: number
          created_at?: string
          flags?: string[]
          id?: string
          message_snippet?: string | null
          persona_id: string
          session_id?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          flags?: string[]
          id?: string
          message_snippet?: string | null
          persona_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_logs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          profile_id: string
          sent_at: string | null
          subject: string
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          profile_id: string
          sent_at?: string | null
          subject: string
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          profile_id?: string
          sent_at?: string | null
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          chat_enabled: boolean
          chat_greeting: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          profile_id: string
          purpose: string
          slug: string
          structured_profile: Json
          title: string
          updated_at: string
        }
        Insert: {
          chat_enabled?: boolean
          chat_greeting?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          profile_id: string
          purpose: string
          slug: string
          structured_profile?: Json
          title: string
          updated_at?: string
        }
        Update: {
          chat_enabled?: boolean
          chat_greeting?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          profile_id?: string
          purpose?: string
          slug?: string
          structured_profile?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          is_public: boolean
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_public?: boolean
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      question_analytics: {
        Row: {
          count: number
          id: string
          last_asked_at: string
          persona_id: string
          sample_question: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          count?: number
          id?: string
          last_asked_at?: string
          persona_id: string
          sample_question?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          count?: number
          id?: string
          last_asked_at?: string
          persona_id?: string
          sample_question?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_analytics_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          target_persona: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
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
