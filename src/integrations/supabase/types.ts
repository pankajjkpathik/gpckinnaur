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
      academic_calendar: {
        Row: {
          academic_year: string
          created_at: string
          events: Json
          exam_dates: Json
          holidays: Json
          id: number
          published: boolean
          sem_end: string
          sem_start: string
          semester_label: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          events?: Json
          exam_dates?: Json
          holidays?: Json
          id?: number
          published?: boolean
          sem_end: string
          sem_start: string
          semester_label: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          events?: Json
          exam_dates?: Json
          holidays?: Json
          id?: number
          published?: boolean
          sem_end?: string
          sem_start?: string
          semester_label?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      announcements: {
        Row: {
          content: string
          created_at: string | null
          id: number
          is_active: boolean
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          is_active?: boolean
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          is_active?: boolean
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: number
          comments: string | null
          feedback: string | null
          file_url: string
          grade: string | null
          graded_at: string | null
          graded_by: number | null
          id: number
          status: string
          student_id: number
          submitted_at: string | null
        }
        Insert: {
          assignment_id: number
          comments?: string | null
          feedback?: string | null
          file_url: string
          grade?: string | null
          graded_at?: string | null
          graded_by?: number | null
          id?: never
          status?: string
          student_id: number
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: number
          comments?: string | null
          feedback?: string | null
          file_url?: string
          grade?: string | null
          graded_at?: string | null
          graded_by?: number | null
          id?: never
          status?: string
          student_id?: number
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          academic_year: string | null
          branch: string
          created_at: string | null
          created_by: number | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: number
          semester: number
          subject_id: number | null
          subject_name: string | null
          title: string
        }
        Insert: {
          academic_year?: string | null
          branch: string
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: never
          semester: number
          subject_id?: number | null
          subject_name?: string | null
          title: string
        }
        Update: {
          academic_year?: string | null
          branch?: string
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: never
          semester?: number
          subject_id?: number | null
          subject_name?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          date: string
          id: number
          locked: boolean
          marked_at: string
          marked_by: number | null
          period_no: number
          status: string
          student_id: number
          subject_id: number
        }
        Insert: {
          date: string
          id?: number
          locked?: boolean
          marked_at?: string
          marked_by?: number | null
          period_no: number
          status: string
          student_id: number
          subject_id: number
        }
        Update: {
          date?: string
          id?: number
          locked?: boolean
          marked_at?: string
          marked_by?: number | null
          period_no?: number
          status?: string
          student_id?: number
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: number | null
          actor_type: string
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: number
          ip: string | null
        }
        Insert: {
          action: string
          actor_id?: number | null
          actor_type: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          ip?: string | null
        }
        Update: {
          action?: string
          actor_id?: number | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          ip?: string | null
        }
        Relationships: []
      }
      circulars: {
        Row: {
          attachment_url: string | null
          audience: string
          body: string
          id: number
          published_at: string
          published_by: number | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          audience?: string
          body: string
          id?: number
          published_at?: string
          published_by?: number | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          audience?: string
          body?: string
          id?: number
          published_at?: string
          published_by?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "circulars_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_id: string
          created_at: string | null
          department: string | null
          id: number
          name: string
          semester: number | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          department?: string | null
          id?: never
          name: string
          semester?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          department?: string | null
          id?: never
          name?: string
          semester?: number | null
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
      disciplinary_actions: {
        Row: {
          action_date: string | null
          created_at: string | null
          detail: string | null
          id: number
          issued_by: number | null
          resolution_date: string | null
          severity: string
          student_id: number
          title: string
        }
        Insert: {
          action_date?: string | null
          created_at?: string | null
          detail?: string | null
          id?: never
          issued_by?: number | null
          resolution_date?: string | null
          severity?: string
          student_id: number
          title: string
        }
        Update: {
          action_date?: string | null
          created_at?: string | null
          detail?: string | null
          id?: never
          issued_by?: number | null
          resolution_date?: string | null
          severity?: string
          student_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      faculty_assignments: {
        Row: {
          academic_year: string
          branch: string
          created_at: string
          id: number
          semester: number
          staff_id: number
          subject_id: number
        }
        Insert: {
          academic_year: string
          branch: string
          created_at?: string
          id?: number
          semester: number
          staff_id: number
          subject_id: number
        }
        Update: {
          academic_year?: string
          branch?: string
          created_at?: string
          id?: number
          semester?: number
          staff_id?: number
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "faculty_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_records: {
        Row: {
          academic_year: string | null
          components: Json
          created_at: string | null
          due_date: string | null
          id: number
          paid_amount: number
          semester: number | null
          status: string
          student_id: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          components?: Json
          created_at?: string | null
          due_date?: string | null
          id?: never
          paid_amount?: number
          semester?: number | null
          status?: string
          student_id: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          components?: Json
          created_at?: string | null
          due_date?: string | null
          id?: never
          paid_amount?: number
          semester?: number | null
          status?: string
          student_id?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scheme: {
        Row: {
          grade: string
          grade_point: number
          id: number
          is_pass: boolean
          max_pct: number
          min_pct: number
        }
        Insert: {
          grade: string
          grade_point?: number
          id?: number
          is_pass?: boolean
          max_pct: number
          min_pct: number
        }
        Update: {
          grade?: string
          grade_point?: number
          id?: number
          is_pass?: boolean
          max_pct?: number
          min_pct?: number
        }
        Relationships: []
      }
      guest_lectures: {
        Row: {
          created_at: string | null
          created_by: number | null
          department: string | null
          detail: string | null
          id: number
          lecture_date: string | null
          speaker: string
          topic: string
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          department?: string | null
          detail?: string | null
          id?: never
          lecture_date?: string | null
          speaker: string
          topic: string
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          department?: string | null
          detail?: string | null
          id?: never
          lecture_date?: string | null
          speaker?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_lectures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      industrial_training: {
        Row: {
          branch: string | null
          company: string | null
          created_at: string | null
          created_by: number | null
          end_date: string | null
          id: number
          semester: number | null
          start_date: string | null
          student_ids: Json
          student_names: Json
          training_type: string
        }
        Insert: {
          branch?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: number | null
          end_date?: string | null
          id?: never
          semester?: number | null
          start_date?: string | null
          student_ids?: Json
          student_names?: Json
          training_type: string
        }
        Update: {
          branch?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: number | null
          end_date?: string | null
          id?: never
          semester?: number | null
          start_date?: string | null
          student_ids?: Json
          student_names?: Json
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "industrial_training_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          applicant_id: number
          applicant_type: string
          applied_at: string
          approver_id: number | null
          approver_remarks: string | null
          comp_off: boolean
          decided_at: string | null
          from_date: string
          id: number
          leave_type: string
          reason: string
          status: string
          substitute_staff_id: number | null
          to_date: string
        }
        Insert: {
          applicant_id: number
          applicant_type: string
          applied_at?: string
          approver_id?: number | null
          approver_remarks?: string | null
          comp_off?: boolean
          decided_at?: string | null
          from_date: string
          id?: number
          leave_type: string
          reason: string
          status?: string
          substitute_staff_id?: number | null
          to_date: string
        }
        Update: {
          applicant_id?: number
          applicant_type?: string
          applied_at?: string
          approver_id?: number | null
          approver_remarks?: string | null
          comp_off?: boolean
          decided_at?: string | null
          from_date?: string
          id?: number
          leave_type?: string
          reason?: string
          status?: string
          substitute_staff_id?: number | null
          to_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_substitute_staff_id_fkey"
            columns: ["substitute_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academic_year: string
          actual_date: string | null
          branch: string
          created_at: string
          hod_remarks: string | null
          id: number
          planned_date: string | null
          semester: number
          staff_id: number
          status: string
          subject_id: number
          topic: string
          unit_id: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          actual_date?: string | null
          branch: string
          created_at?: string
          hod_remarks?: string | null
          id?: number
          planned_date?: string | null
          semester: number
          staff_id: number
          status?: string
          subject_id: number
          topic: string
          unit_id?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          actual_date?: string | null
          branch?: string
          created_at?: string
          hod_remarks?: string | null
          id?: number
          planned_date?: string | null
          semester?: number
          staff_id?: number
          status?: string
          subject_id?: number
          topic?: string
          unit_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "syllabus_units"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          academic_year: string
          approved_by_hod: boolean
          created_at: string
          entered_by: number | null
          exam_type: string
          id: number
          locked: boolean
          max_marks: number
          obtained: number | null
          remarks: string | null
          returned_remarks: string | null
          student_id: number
          subject_id: number
          submitted_to_hod: boolean
          updated_at: string
        }
        Insert: {
          academic_year: string
          approved_by_hod?: boolean
          created_at?: string
          entered_by?: number | null
          exam_type: string
          id?: number
          locked?: boolean
          max_marks: number
          obtained?: number | null
          remarks?: string | null
          returned_remarks?: string | null
          student_id: number
          subject_id: number
          submitted_to_hod?: boolean
          updated_at?: string
        }
        Update: {
          academic_year?: string
          approved_by_hod?: boolean
          created_at?: string
          entered_by?: number | null
          exam_type?: string
          id?: number
          locked?: boolean
          max_marks?: number
          obtained?: number | null
          remarks?: string | null
          returned_remarks?: string | null
          student_id?: number
          subject_id?: number
          submitted_to_hod?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: number
          read_at: string | null
          recipient_id: number
          recipient_kind: string
          sender_id: number
          sender_kind: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: number
          read_at?: string | null
          recipient_id: number
          recipient_kind: string
          sender_id: number
          sender_kind: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: number
          read_at?: string | null
          recipient_id?: number
          recipient_kind?: string
          sender_id?: number
          sender_kind?: string
        }
        Relationships: []
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
      parent_messages: {
        Row: {
          body: string | null
          created_at: string | null
          from_name: string
          id: number
          status: string
          student_id: number | null
          student_name: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          from_name: string
          id?: never
          status?: string
          student_id?: number | null
          student_name?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          from_name?: string
          id?: never
          status?: string
          student_id?: number | null
          student_name?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_users: {
        Row: {
          created_at: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          student_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          student_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          student_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_users_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_documents: {
        Row: {
          branch: string | null
          created_at: string | null
          doc_type: string
          file_b64: string
          file_name: string
          id: number
          semester: number | null
          title: string
          uploaded_by: number | null
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          doc_type: string
          file_b64: string
          file_name: string
          id?: never
          semester?: number | null
          title: string
          uploaded_by?: number | null
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          doc_type?: string
          file_b64?: string
          file_name?: string
          id?: never
          semester?: number | null
          title?: string
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      periods_master: {
        Row: {
          end_time: string
          id: number
          is_break: boolean
          label: string | null
          period_no: number
          start_time: string
        }
        Insert: {
          end_time: string
          id?: number
          is_break?: boolean
          label?: string | null
          period_no: number
          start_time: string
        }
        Update: {
          end_time?: string
          id?: number
          is_break?: boolean
          label?: string | null
          period_no?: number
          start_time?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          branch: string | null
          company: string
          created_at: string | null
          created_by: number | null
          id: number
          package_lpa: number | null
          roll_number: string | null
          student_id: number | null
          student_name: string
          year: number
        }
        Insert: {
          branch?: string | null
          company: string
          created_at?: string | null
          created_by?: number | null
          id?: never
          package_lpa?: number | null
          roll_number?: string | null
          student_id?: number | null
          student_name: string
          year: number
        }
        Update: {
          branch?: string | null
          company?: string
          created_at?: string | null
          created_by?: number | null
          id?: never
          package_lpa?: number | null
          roll_number?: string | null
          student_id?: number | null
          student_name?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "placements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ptm_meetings: {
        Row: {
          agenda: Json
          created_at: string | null
          id: number
          meet_link: string | null
          meeting_date: string | null
          meeting_time: string | null
          updated_at: string | null
        }
        Insert: {
          agenda?: Json
          created_at?: string | null
          id?: never
          meet_link?: string | null
          meeting_date?: string | null
          meeting_time?: string | null
          updated_at?: string | null
        }
        Update: {
          agenda?: Json
          created_at?: string | null
          id?: never
          meet_link?: string | null
          meeting_date?: string | null
          meeting_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string
          file_b64: string
          file_name: string
          id: number
          kind: string
          name: string
          updated_at: string
          uploaded_by: number | null
        }
        Insert: {
          created_at?: string
          file_b64: string
          file_name: string
          id?: number
          kind: string
          name: string
          updated_at?: string
          uploaded_by?: number | null
        }
        Update: {
          created_at?: string
          file_b64?: string
          file_name?: string
          id?: number
          kind?: string
          name?: string
          updated_at?: string
          uploaded_by?: number | null
        }
        Relationships: []
      }
      staff_salary: {
        Row: {
          basic: number
          created_at: string
          da: number
          deductions: number
          hra: number
          id: number
          month: number
          net_pay: number | null
          other_allow: number
          paid_on: string | null
          remarks: string | null
          staff_id: number
          updated_at: string
          year: number
        }
        Insert: {
          basic?: number
          created_at?: string
          da?: number
          deductions?: number
          hra?: number
          id?: number
          month: number
          net_pay?: number | null
          other_allow?: number
          paid_on?: string | null
          remarks?: string | null
          staff_id: number
          updated_at?: string
          year: number
        }
        Update: {
          basic?: number
          created_at?: string
          da?: number
          deductions?: number
          hra?: number
          id?: number
          month?: number
          net_pay?: number | null
          other_allow?: number
          paid_on?: string | null
          remarks?: string | null
          staff_id?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_salary_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_joining: string | null
          date_of_retirement: string | null
          department: string | null
          designation: string | null
          dob: string | null
          email: string | null
          extra_roles: string[]
          id: number
          image_url: string | null
          ip_number: string | null
          is_active: boolean | null
          last_login: string | null
          last_salary_drawn: number | null
          name: string | null
          password_hash: string
          phone: string | null
          pmis_number: string | null
          role: string
          staff_id: number | null
          username: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_joining?: string | null
          date_of_retirement?: string | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          email?: string | null
          extra_roles?: string[]
          id?: never
          image_url?: string | null
          ip_number?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_salary_drawn?: number | null
          name?: string | null
          password_hash: string
          phone?: string | null
          pmis_number?: string | null
          role: string
          staff_id?: number | null
          username: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_joining?: string | null
          date_of_retirement?: string | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          email?: string | null
          extra_roles?: string[]
          id?: never
          image_url?: string | null
          ip_number?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_salary_drawn?: number | null
          name?: string | null
          password_hash?: string
          phone?: string | null
          pmis_number?: string | null
          role?: string
          staff_id?: number | null
          username?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          admission_date: string | null
          bank_account_number: string | null
          batch_year: number
          branch: string
          created_at: string | null
          dob: string | null
          email: string | null
          enrollment_no: string
          father_name: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: number
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_phone: string | null
          password_hash: string
          phone: string | null
          semester: number
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          admission_date?: string | null
          bank_account_number?: string | null
          batch_year: number
          branch: string
          created_at?: string | null
          dob?: string | null
          email?: string | null
          enrollment_no: string
          father_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_phone?: string | null
          password_hash: string
          phone?: string | null
          semester: number
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          admission_date?: string | null
          bank_account_number?: string | null
          batch_year?: number
          branch?: string
          created_at?: string | null
          dob?: string | null
          email?: string | null
          enrollment_no?: string
          father_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_phone?: string | null
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
      subjects: {
        Row: {
          branch: string
          category: Database["public"]["Enums"]["subject_category"] | null
          code: string
          created_at: string
          credits: number
          dcs_bs_hours: number
          external_practical_marks: number
          external_theory_marks: number
          id: number
          internal_practical_marks: number
          internal_theory_marks: number
          kind: string
          lecture_hours: number
          name: string
          practical_hours: number
          semester: number
          total_marks: number
          total_weekly_load: number
          updated_at: string
        }
        Insert: {
          branch: string
          category?: Database["public"]["Enums"]["subject_category"] | null
          code: string
          created_at?: string
          credits?: number
          dcs_bs_hours?: number
          external_practical_marks?: number
          external_theory_marks?: number
          id?: number
          internal_practical_marks?: number
          internal_theory_marks?: number
          kind?: string
          lecture_hours?: number
          name: string
          practical_hours?: number
          semester: number
          total_marks?: number
          total_weekly_load?: number
          updated_at?: string
        }
        Update: {
          branch?: string
          category?: Database["public"]["Enums"]["subject_category"] | null
          code?: string
          created_at?: string
          credits?: number
          dcs_bs_hours?: number
          external_practical_marks?: number
          external_theory_marks?: number
          id?: number
          internal_practical_marks?: number
          internal_theory_marks?: number
          kind?: string
          lecture_hours?: number
          name?: string
          practical_hours?: number
          semester?: number
          total_marks?: number
          total_weekly_load?: number
          updated_at?: string
        }
        Relationships: []
      }
      syllabus_units: {
        Row: {
          created_at: string
          hours: number
          id: number
          subject_id: number
          title: string
          topics: Json
          unit_no: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: number
          subject_id: number
          title: string
          topics?: Json
          unit_no: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: number
          subject_id?: number
          title?: string
          topics?: Json
          unit_no?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable: {
        Row: {
          academic_year: string
          branch: string
          co_staff_ids: number[]
          created_at: string
          day_of_week: number
          group_label: string
          id: number
          period_no: number
          published: boolean
          room: string | null
          semester: number
          span_periods: number
          staff_id: number | null
          subject_id: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          branch: string
          co_staff_ids?: number[]
          created_at?: string
          day_of_week: number
          group_label?: string
          id?: number
          period_no: number
          published?: boolean
          room?: string | null
          semester: number
          span_periods?: number
          staff_id?: number | null
          subject_id?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          branch?: string
          co_staff_ids?: number[]
          created_at?: string
          day_of_week?: number
          group_label?: string
          id?: number
          period_no?: number
          published?: boolean
          room?: string | null
          semester?: number
          span_periods?: number
          staff_id?: number | null
          subject_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
      subject_category:
        | "BS"
        | "HS"
        | "ES"
        | "PCC"
        | "PE"
        | "OE"
        | "AU"
        | "Project"
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
      subject_category: ["BS", "HS", "ES", "PCC", "PE", "OE", "AU", "Project"],
    },
  },
} as const
