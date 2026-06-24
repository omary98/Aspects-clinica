/**
 * WhatsApp notification placeholder.
 * In v1, we log payloads to notification_logs but do not send via provider.
 * To activate in v2: replace logWhatsAppPayload with your provider SDK call.
 */

import type { AppointmentWithDetails } from '@/types/database'
import { formatDate, formatTime } from '@/lib/utils'

export interface WhatsAppPayload {
  to: string
  template: string
  language: string
  components: Array<{
    type: string
    parameters: Array<{ type: string; text?: string }>
  }>
}

export function buildPatientConfirmationPayload(
  appt: AppointmentWithDetails
): WhatsAppPayload {
  const phone = `${appt.patient_phone_country_code}${appt.patient_phone}`.replace(/\D/g, '')

  return {
    to: phone,
    template: 'appointment_confirmation',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: appt.patient_name },
          { type: 'text', text: appt.doctors.name_en },
          { type: 'text', text: formatDate(appt.appointment_date) },
          { type: 'text', text: formatTime(appt.start_time) },
          { type: 'text', text: appt.branches.name_en },
        ],
      },
    ],
  }
}

export function buildAdminNotificationPayload(
  appt: AppointmentWithDetails,
  adminPhone: string
): WhatsAppPayload {
  return {
    to: adminPhone.replace(/\D/g, ''),
    template: 'admin_new_booking',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: appt.patient_name },
          { type: 'text', text: appt.doctors.name_en },
          { type: 'text', text: formatDate(appt.appointment_date) },
          { type: 'text', text: formatTime(appt.start_time) },
        ],
      },
    ],
  }
}

// Future: replace with actual provider call (Twilio, Meta Cloud API, etc.)
export async function sendWhatsApp(payload: WhatsAppPayload): Promise<void> {
  console.log('[WhatsApp Placeholder] Would send:', JSON.stringify(payload, null, 2))
  // TODO v2: await providerClient.messages.create(payload)
}
