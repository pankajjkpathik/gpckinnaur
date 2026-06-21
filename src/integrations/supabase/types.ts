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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alumni_registrations: {
        Row: {
          batch_year: number | null
          branch: string | null
          date_of_birth: string | null
          designation_sector: string | null
          email: string | null
          father_name: string | null
          id: number
          is_verified: boolean | null
          name: string | null
          phone: string | null
          present_address: string | null
          profile_type: string | null
          salary_package: string | null
          submitted_at: string | null
        }
        Insert: {
          batch_year?: number | null
          branch?: string | null
          date_of_birth?: string | null
          designation_sector?: string | null
          email?: string | null
          father_name?: string | null
          id?: never
          is_verified?: boolean | null
          name?: string | null
          phone?: string | null
          present_address?: string | null
          profile_type?: string | null
          salary_package?: string | null
          submitted_at?: string | null
        }
        Update: {
          batch_year?: number | null
          branch?: string | null
          date_of_birth?: string | null
          designation_sector?: string | null
          email?: string | null
          father_name?: string | null
          id?: never
          is_verified?: boolean | null
          name?: string | null
          phone?: string | null
          present_address?: string | null
          profile_type?: string | null
          salary_package?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          email: string | null
          id: number
          is_read: boolean | null
          message: string | null
          name: string | null
          phone: string | null
          subject: string | null
          submitted_at: string | null
        }
        Insert: {
          email?: string | null
          id?: never
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          phone?: string | null
          subject?: string | null
          submitted_at?: string | null
        }
        Update: {
          email?: string | null
          id?: never
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          phone?: string | null
          subject?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          description: string | null
          id: number
          image: string | null
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: never
          image?: string | null
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: never
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          date: string | null
          description: string | null
          id: number
          image: string | null
          location: string | null
          title: string
        }
        Insert: {
          date?: string | null
          description?: string | null
          id?: never
          image?: string | null
          location?: string | null
          title: string
        }
        Update: {
          date?: string | null
          description?: string | null
          id?: never
          image?: string | null
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      faculty: {
        Row: {
          department_id: number | null
          designation: string | null
          email: string | null
          experience: string | null
          id: number
          image: string | null
          name: string
          qualification: string | null
        }
        Insert: {
          department_id?: number | null
          designation?: string | null
          email?: string | null
          experience?: string | null
          id?: never
          image?: string | null
          name: string
          qualification?: string | null
        }
        Update: {
          department_id?: number | null
          designation?: string | null
          email?: string | null
          experience?: string | null
          id?: never
          image?: string | null
          name?: string
          qualification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          category: string | null
          content: string | null
          date: string | null
          id: number
          link: string | null
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          date?: string | null
          id?: never
          link?: string | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          date?: string | null
          id?: never
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          created_at: string | null
          department: string | null
          id: number
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: string
          staff_id: number | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: never
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role: string
          staff_id?: number | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: never
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: string
          staff_id?: number | null
          username?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          batch_year: number
          branch: string
          created_at: string | null
          email: string | null
          enrollment_no: string
          father_name: string | null
          id: number
          is_active: boolean | null
          name: string
          password_hash: string
          phone: string | null
          semester: number
        }
        Insert: {
          batch_year: number
          branch: string
          created_at?: string | null
          email?: string | null
          enrollment_no: string
          father_name?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          password_hash: string
          phone?: string | null
          semester: number
        }
        Update: {
          batch_year?: number
          branch?: string
          created_at?: string | null
          email?: string | null
          enrollment_no?: string
          father_name?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          password_hash?: string
          phone?: string | null
          semester?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          department: string | null
          file_url: string
          id: number
          semester: number | null
          subject: string | null
          title: string
          type: string
          uploaded_at: string | null
          uploaded_by: number | null
        }
        Insert: {
          department?: string | null
          file_url: string
          id?: never
          semester?: number | null
          subject?: string | null
          title: string
          type: string
          uploaded_at?: string | null
          uploaded_by?: number | null
        }
        Update: {
          department?: string | null
          file_url?: string
          id?: never
          semester?: number | null
          subject?: string | null
          title?: string
          type?: string
          uploaded_at?: string | null
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
