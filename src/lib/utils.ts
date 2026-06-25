import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, addMinutes } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, 'h:mm a')
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startDate = new Date()
  startDate.setHours(startH, startM, 0, 0)

  const endDate = new Date()
  endDate.setHours(endH, endM, 0, 0)

  let current = startDate
  while (current < endDate) {
    const slotEnd = addMinutes(current, durationMinutes)
    if (slotEnd <= endDate) {
      slots.push(format(current, 'HH:mm'))
    }
    current = addMinutes(current, durationMinutes)
  }

  return slots
}

export function getSlotEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  const end = addMinutes(date, durationMinutes)
  return format(end, 'HH:mm')
}

export function isSlotAvailable(
  slotStart: string,
  slotDate: string,
  bookedSlots: Array<{ start_time: string; end_time: string }>,
  durationMinutes: number
): boolean {
  const slotEnd = getSlotEndTime(slotStart, durationMinutes)

  return !bookedSlots.some((booked) => {
    // Overlap check: slot starts before booked ends AND slot ends after booked starts
    return slotStart < booked.end_time && slotEnd > booked.start_time
  })
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const COUNTRY_CODES = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
]

const PHONE_RULES: Record<string, { pattern: RegExp; example: string }> = {
  '+20': { pattern: /^01[0-9]{9}$/, example: '01282344448' },
  '+966': { pattern: /^5[0-9]{8}$/, example: '512345678' },
  '+971': { pattern: /^5[0-9]{8}$/, example: '501234567' },
  '+965': { pattern: /^[0-9]{8}$/, example: '51234567' },
  '+974': { pattern: /^[0-9]{8}$/, example: '33123456' },
  '+973': { pattern: /^[0-9]{8}$/, example: '36123456' },
  '+968': { pattern: /^[0-9]{8}$/, example: '91234567' },
  '+962': { pattern: /^7[0-9]{8}$/, example: '791234567' },
  '+961': { pattern: /^[0-9]{7,8}$/, example: '71123456' },
  '+963': { pattern: /^9[0-9]{8}$/, example: '931234567' },
  '+964': { pattern: /^7[0-9]{9}$/, example: '7712345678' },
  '+1': { pattern: /^[0-9]{10}$/, example: '2125550198' },
  '+44': { pattern: /^(7[0-9]{9}|[0-9]{10,11})$/, example: '7123456789' },
  '+49': { pattern: /^[0-9]{10,12}$/, example: '15123456789' },
  '+33': { pattern: /^([67][0-9]{8}|[0-9]{9})$/, example: '612345678' },
  '+39': { pattern: /^[0-9]{9,10}$/, example: '3123456789' },
  '+34': { pattern: /^[67][0-9]{8}$/, example: '612345678' },
  '+31': { pattern: /^6[0-9]{8}$/, example: '612345678' },
  '+90': { pattern: /^5[0-9]{9}$/, example: '5321234567' },
  '+7': { pattern: /^9[0-9]{9}$/, example: '9123456789' },
}

export function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

export function validatePhoneNumberForCountry(countryCode: string, value: string): boolean {
  const digits = normalizePhoneNumber(value)
  const rule = PHONE_RULES[countryCode]
  if (rule) return rule.pattern.test(digits)
  return /^[0-9]{7,15}$/.test(digits)
}

export function getPhoneValidationMessage(countryCode: string, value: string): string {
  if (!value) return ''
  if (validatePhoneNumberForCountry(countryCode, value)) return ''
  const rule = PHONE_RULES[countryCode]
  return `Enter a valid ${countryCode} phone number${rule ? `, e.g. ${rule.example}` : ''}.`
}

export const REFERRAL_SOURCES = [
  'Social Media',
  'Google Search',
  'Friend / Family Referral',
  'Doctor Referral',
  'Hospital Referral',
  'Walk-in',
  'Other',
]

export const STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  attended: 'bg-green-100 text-green-800 border-green-200',
  no_show: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
}

export const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reserved',
  confirmed: 'Confirmed',
  attended: 'Attended',
  no_show: 'No Show',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}
