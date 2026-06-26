import { Resend } from 'resend'
import type { AppointmentWithDetails } from '@/types/database'
import { formatTime } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
  return _resend
}
const FROM = process.env.EMAIL_FROM || 'aspectsclinica@gmail.com'
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3500'
const BRAND_BLUE = '#123B67'
const BRAND_LIME = '#BFEA1C'

const AR_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatDateAr(dateStr: string): string {
  const d = parseISO(dateStr)
  return `${AR_DAY_NAMES[d.getDay()]}، ${format(d, 'd/M/yyyy')}`
}

function appointmentSummaryHtmlEn(appt: AppointmentWithDetails): string {
  const dateStr = format(parseISO(appt.appointment_date), 'EEEE, MMMM d, yyyy')
  return `
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:8px;color:#666;width:40%">Patient</td><td style="padding:8px;font-weight:600">${appt.patient_name}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Date</td><td style="padding:8px;font-weight:600">${dateStr}</td></tr>
      <tr><td style="padding:8px;color:#666">Time</td><td style="padding:8px;font-weight:600">${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Doctor</td><td style="padding:8px;font-weight:600">${appt.doctors.name_en}</td></tr>
      <tr><td style="padding:8px;color:#666">Specialty</td><td style="padding:8px">${appt.specialties.name_en}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Location</td><td style="padding:8px">${appt.branches.name_en}</td></tr>
      ${appt.services ? `<tr><td style="padding:8px;color:#666">Service</td><td style="padding:8px">${appt.services.name_en}</td></tr>` : ''}
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Phone</td><td style="padding:8px">${appt.patient_phone_country_code} ${appt.patient_phone}</td></tr>
    </table>
  `
}

function appointmentSummaryHtmlAr(appt: AppointmentWithDetails): string {
  const doctorName = appt.doctors.name_ar || appt.doctors.name_en
  const specialty = appt.specialties.name_ar || appt.specialties.name_en
  const branch = appt.branches.name_ar || appt.branches.name_en
  const service = appt.services ? (appt.services.name_ar || appt.services.name_en) : null
  const dateStr = formatDateAr(appt.appointment_date)
  return `
    <table dir="rtl" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;text-align:right;">
      <tr><td style="padding:8px;color:#666;width:40%">المريض</td><td style="padding:8px;font-weight:600">${appt.patient_name}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">التاريخ</td><td style="padding:8px;font-weight:600">${dateStr}</td></tr>
      <tr><td style="padding:8px;color:#666">الوقت</td><td style="padding:8px;font-weight:600" dir="ltr">${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">الطبيب</td><td style="padding:8px;font-weight:600">${doctorName}</td></tr>
      <tr><td style="padding:8px;color:#666">التخصص</td><td style="padding:8px">${specialty}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">الموقع</td><td style="padding:8px">${branch}</td></tr>
      ${service ? `<tr><td style="padding:8px;color:#666">الخدمة</td><td style="padding:8px">${service}</td></tr>` : ''}
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">الهاتف</td><td style="padding:8px" dir="ltr">${appt.patient_phone_country_code} ${appt.patient_phone}</td></tr>
    </table>
  `
}

export async function sendPatientConfirmation(
  appt: AppointmentWithDetails,
  lang: 'ar' | 'en' = 'ar'
): Promise<{ success: boolean; error?: string }> {
  if (!appt.patient_email) return { success: false, error: 'No patient email' }

  const isAr = lang === 'ar'
  const doctorNameForSubject = (isAr ? appt.doctors.name_ar : null) || appt.doctors.name_en
  const subject = isAr
    ? `تأكيد الحجز — ${doctorNameForSubject} · ${formatDateAr(appt.appointment_date)}`
    : `Appointment Confirmed – ${doctorNameForSubject} on ${format(parseISO(appt.appointment_date), 'MMMM d, yyyy')}`

  const html = isAr
    ? `
      <div dir="rtl" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;text-align:right;">
        <div style="background:${BRAND_BLUE};padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">Aspects Clinica</h1>
          <p style="color:${BRAND_LIME};margin:8px 0 0;">تأكيد الحجز</p>
        </div>
        <div style="padding:32px;">
          <p>عزيزنا / عزيزتنا <strong>${appt.patient_name}</strong>،</p>
          <p>تم تسجيل موعدك بنجاح. إليك تفاصيل الحجز:</p>
          ${appointmentSummaryHtmlAr(appt)}
          <p style="margin-top:24px;padding:16px;background:#fef9e7;border-right:4px solid #f39c12;border-radius:4px;">
            <strong>تنبيه مهم:</strong> يرجى الحضور قبل موعدك بـ 10 دقائق.
            في حال الرغبة في الإلغاء أو إعادة الجدولة، يرجى التواصل معنا في أقرب وقت ممكن.
          </p>
          <p>للاستفسار، تواصل معنا على <a href="mailto:aspectsclinica@gmail.com" style="color:${BRAND_BLUE};">aspectsclinica@gmail.com</a></p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#666;">
          أسبكتس كلينيكا · القاهرة
        </div>
      </div>
    `
    : `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#1a1a1a;">
        <div style="background:${BRAND_BLUE};padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">Aspects Clinica</h1>
          <p style="color:${BRAND_LIME};margin:8px 0 0;">Appointment Confirmation</p>
        </div>
        <div style="padding:32px;">
          <p>Dear <strong>${appt.patient_name}</strong>,</p>
          <p>Your appointment has been successfully reserved. Here are your details:</p>
          ${appointmentSummaryHtmlEn(appt)}
          <p style="margin-top:24px;padding:16px;background:#fef9e7;border-left:4px solid #f39c12;border-radius:4px;">
            <strong>Important:</strong> Please arrive 10 minutes before your scheduled time.
            If you need to cancel or reschedule, please contact us as soon as possible.
          </p>
          <p>For any queries, please contact us at <a href="mailto:aspectsclinica@gmail.com" style="color:${BRAND_BLUE};">aspectsclinica@gmail.com</a></p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#666;">
          Aspects Clinica Polyclinic · Cairo
        </div>
      </div>
    `

  try {
    await getResend().emails.send({
      from: `Aspects Clinica Reservations <${FROM}>`,
      to: appt.patient_email,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function sendAdminNotification(
  appt: AppointmentWithDetails,
  adminEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!adminEmails.length) return { success: false, error: 'No admin emails' }

  const dateStr = format(parseISO(appt.appointment_date), 'EEEE, MMMM d, yyyy')

  try {
    await getResend().emails.send({
      from: `Aspects Clinica Booking System <${FROM}>`,
      to: adminEmails,
      subject: `New Reservation: ${appt.patient_name} – ${appt.doctors.name_en} on ${dateStr}`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#1a1a1a;">
          <div style="background:${BRAND_BLUE};padding:24px;">
            <h2 style="color:white;margin:0;font-size:18px;">New Appointment Reserved</h2>
          </div>
          <div style="padding:24px;">
            ${appointmentSummaryHtmlEn(appt)}
            ${appt.primary_complaint ? `<p style="margin-top:16px;"><strong>Complaint:</strong> ${appt.primary_complaint}</p>` : ''}
            ${appt.notes ? `<p><strong>Notes:</strong> ${appt.notes}</p>` : ''}
            <p><strong>Patient Type:</strong> ${appt.is_new_patient ? 'New Patient' : 'Follow-up'}</p>
            ${appt.referral_source ? `<p><strong>Referral Source:</strong> ${appt.referral_source}</p>` : ''}
            <div style="margin-top:24px;">
              <a href="${BASE_URL}/admin/appointments/${appt.id}"
                 style="background:${BRAND_BLUE};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                View in Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function sendReminderEmail(
  appt: AppointmentWithDetails,
  reminderType: '24h' | 'same_day',
  lang: 'ar' | 'en' = 'ar'
): Promise<{ success: boolean; error?: string }> {
  if (!appt.patient_email) return { success: false, error: 'No patient email' }

  const isAr = lang === 'ar'
  const doctorName = (isAr ? appt.doctors.name_ar : null) || appt.doctors.name_en
  const subject = isAr
    ? reminderType === '24h'
      ? `تذكير بموعدك غداً — ${doctorName}`
      : `تذكير بموعد اليوم — ${doctorName} الساعة ${formatTime(appt.start_time)}`
    : reminderType === '24h'
      ? `Reminder: Your appointment tomorrow – ${doctorName}`
      : `Today's Appointment Reminder – ${doctorName} at ${formatTime(appt.start_time)}`

  const body = isAr
    ? `<p>عزيزنا / عزيزتنا <strong>${appt.patient_name}</strong>، هذا تذكير بموعدك القادم:</p>${appointmentSummaryHtmlAr(appt)}`
    : `<p>Dear <strong>${appt.patient_name}</strong>, this is a reminder about your upcoming appointment:</p>${appointmentSummaryHtmlEn(appt)}`

  try {
    await getResend().emails.send({
      from: `Aspects Clinica Reminders <${FROM}>`,
      to: appt.patient_email,
      subject,
      html: `
        <div dir="${isAr ? 'rtl' : 'ltr'}" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;${isAr ? 'text-align:right;' : ''}">
          <div style="background:${BRAND_BLUE};padding:24px;text-align:${isAr ? 'right' : 'left'};">
            <h2 style="color:white;margin:0;">${isAr ? 'تذكير بالموعد' : 'Appointment Reminder'}</h2>
          </div>
          <div style="padding:24px;">${body}</div>
        </div>
      `,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
