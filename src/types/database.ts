export type AdminRole = 'medical_director' | 'reception_head'

export type AppointmentStatus =
  | 'reserved'
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled'
  | 'rescheduled'

export type NotificationType = 'email' | 'whatsapp'
export type NotificationEvent =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'reminder_24h'
  | 'reminder_same_day'

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          role: AdminRole
          email: string
          whatsapp_number: string | null
          notifications_enabled: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>
      }
      specialties: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          slug: string
          description_en: string | null
          description_ar: string | null
          icon: string | null
          image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['specialties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['specialties']['Insert']>
      }
      branches: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          slug: string
          address_en: string | null
          address_ar: string | null
          google_maps_url: string | null
          phone: string | null
          is_public_branch: boolean
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['branches']['Insert']>
      }
      rooms: {
        Row: {
          id: string
          branch_id: string
          name_en: string
          name_ar: string
          room_type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      doctors: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          specialty_id: string
          title_en: string
          title_ar: string
          bio_en: string | null
          bio_ar: string | null
          description_en: string | null
          description_ar: string | null
          photo_url: string | null
          consultation_fee: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>
      }
      services: {
        Row: {
          id: string
          specialty_id: string
          doctor_id: string | null
          name_en: string
          name_ar: string
          description_en: string | null
          description_ar: string | null
          duration_minutes: number
          fee: number | null
          is_visible_to_patients: boolean
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      service_doctors: {
        Row: {
          id: string
          service_id: string
          doctor_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['service_doctors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['service_doctors']['Insert']>
      }
      doctor_schedule_templates: {
        Row: {
          id: string
          doctor_id: string
          branch_id: string
          day_of_week: number
          start_time: string
          end_time: string
          first_come_first_serve: boolean
          first_come_capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctor_schedule_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['doctor_schedule_templates']['Insert']>
      }
      schedule_room_assignments: {
        Row: {
          id: string
          schedule_template_id: string
          room_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['schedule_room_assignments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['schedule_room_assignments']['Insert']>
      }
      blocked_times: {
        Row: {
          id: string
          block_date: string
          start_time: string | null
          end_time: string | null
          doctor_id: string | null
          room_id: string | null
          branch_id: string | null
          reason: string | null
          is_full_day: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['blocked_times']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['blocked_times']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          patient_name: string
          patient_age: number | null
          patient_phone_country_code: string
          patient_phone: string
          patient_email: string | null
          doctor_id: string
          specialty_id: string
          branch_id: string
          service_id: string | null
          appointment_date: string
          start_time: string
          end_time: string
          duration_at_booking: number
          fee_at_booking: number | null
          primary_complaint: string | null
          referral_source: string | null
          is_new_patient: boolean
          notes: string | null
          status: AppointmentStatus
          rescheduled_from_id: string | null
          patient_confirmed_change: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      appointment_rooms: {
        Row: {
          id: string
          appointment_id: string
          room_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointment_rooms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointment_rooms']['Insert']>
      }
      appointment_status_history: {
        Row: {
          id: string
          appointment_id: string
          previous_status: AppointmentStatus | null
          new_status: AppointmentStatus
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointment_status_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointment_status_history']['Insert']>
      }
      notification_recipients: {
        Row: {
          id: string
          admin_profile_id: string
          email_enabled: boolean
          whatsapp_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_recipients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notification_recipients']['Insert']>
      }
      notification_logs: {
        Row: {
          id: string
          appointment_id: string
          type: NotificationType
          event: NotificationEvent
          recipient_email: string | null
          recipient_phone: string | null
          payload: Record<string, unknown>
          sent_at: string | null
          error: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>
      }
      clinic_settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clinic_settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clinic_settings']['Insert']>
      }
      site_assets: {
        Row: {
          id: string
          key: string | null
          label: string
          bucket: string
          path: string
          public_url: string
          asset_type: string
          folder: string
          mime_type: string | null
          size_bytes: number | null
          alt_text_ar: string | null
          alt_text_en: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['site_assets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['site_assets']['Insert']>
      }
      site_content: {
        Row: {
          id: string
          section_key: string
          field_key: string
          value_ar: string | null
          value_en: string | null
          content_type: string
          asset_id: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['site_content']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          admin_user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}

// Convenience types
export type Specialty = Database['public']['Tables']['specialties']['Row']
export type Branch = Database['public']['Tables']['branches']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Doctor = Database['public']['Tables']['doctors']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type ServiceDoctor = Database['public']['Tables']['service_doctors']['Row']
export type ScheduleTemplate = Database['public']['Tables']['doctor_schedule_templates']['Row']
export type ScheduleRoomAssignment = Database['public']['Tables']['schedule_room_assignments']['Row']
export type BlockedTime = Database['public']['Tables']['blocked_times']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type AppointmentRoom = Database['public']['Tables']['appointment_rooms']['Row']
export type AdminProfile = Database['public']['Tables']['admin_profiles']['Row']
export type ClinicSetting = Database['public']['Tables']['clinic_settings']['Row']
export type SiteAsset = Database['public']['Tables']['site_assets']['Row']
export type SiteContent = Database['public']['Tables']['site_content']['Row']
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']

// Extended types for joins
export type DoctorWithSpecialty = Doctor & {
  specialties: Specialty
}

export type AppointmentWithDetails = Appointment & {
  doctors: Pick<Doctor, 'id' | 'name_en' | 'name_ar' | 'title_en' | 'title_ar'>
  specialties: Pick<Specialty, 'id' | 'name_en' | 'name_ar'>
  branches: Pick<Branch, 'id' | 'name_en' | 'name_ar'>
  services: Pick<Service, 'id' | 'name_en' | 'name_ar' | 'duration_minutes'> | null
  appointment_rooms: (AppointmentRoom & { rooms: Pick<Room, 'id' | 'name_en' | 'name_ar'> })[]
}

export type ScheduleWithDetails = ScheduleTemplate & {
  doctors: Pick<Doctor, 'id' | 'name_en'>
  branches: Pick<Branch, 'id' | 'name_en'>
  schedule_room_assignments: (ScheduleRoomAssignment & { rooms: Pick<Room, 'id' | 'name_en'> })[]
}
