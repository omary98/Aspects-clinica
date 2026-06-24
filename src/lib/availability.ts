import { addDays, format, isAfter, isBefore, parseISO, addHours, startOfDay } from 'date-fns'
import { generateTimeSlots, getSlotEndTime } from './utils'

export interface AvailableSlot {
  time: string
  endTime: string
}

export interface AvailabilityParams {
  doctorId: string
  branchId: string
  date: string
  durationMinutes: number
  schedules: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    branch_id: string
    doctor_id: string
  }>
  bookedAppointments: Array<{
    start_time: string
    end_time: string
    status: string
    doctor_id: string
    branch_id: string
    appointment_date: string
  }>
  blockedTimes: Array<{
    block_date: string
    start_time: string | null
    end_time: string | null
    doctor_id: string | null
    branch_id: string | null
    is_full_day: boolean
  }>
  minNoticeHours?: number
}

export function getAvailableSlots(params: AvailabilityParams): AvailableSlot[] {
  const {
    doctorId,
    branchId,
    date,
    durationMinutes,
    schedules,
    bookedAppointments,
    blockedTimes,
    minNoticeHours = 6,
  } = params

  const targetDate = parseISO(date)
  const dayOfWeek = targetDate.getDay()

  // Find matching schedule
  const schedule = schedules.find(
    (s) =>
      s.doctor_id === doctorId &&
      s.branch_id === branchId &&
      s.day_of_week === dayOfWeek
  )

  if (!schedule) return []

  // Check if full day is blocked for this doctor/branch
  const fullDayBlocked = blockedTimes.some(
    (b) =>
      b.block_date === date &&
      b.is_full_day &&
      (b.doctor_id === null || b.doctor_id === doctorId) &&
      (b.branch_id === null || b.branch_id === branchId)
  )

  if (fullDayBlocked) return []

  // Get partial blocks for the day
  const partialBlocks = blockedTimes.filter(
    (b) =>
      b.block_date === date &&
      !b.is_full_day &&
      (b.doctor_id === null || b.doctor_id === doctorId) &&
      (b.branch_id === null || b.branch_id === branchId)
  )

  // Get active bookings for this doctor on this date
  const activeStatuses = ['reserved', 'confirmed']
  const existingBookings = bookedAppointments.filter(
    (a) =>
      a.doctor_id === doctorId &&
      a.appointment_date === date &&
      activeStatuses.includes(a.status)
  )

  // Generate all possible slots
  const allSlots = generateTimeSlots(schedule.start_time, schedule.end_time, durationMinutes)

  const now = new Date()
  const cutoff = addHours(now, minNoticeHours)

  return allSlots
    .map((slotTime) => ({
      time: slotTime,
      endTime: getSlotEndTime(slotTime, durationMinutes),
    }))
    .filter(({ time, endTime }) => {
      // Check same-day cutoff
      const [h, m] = time.split(':').map(Number)
      const slotDateTime = new Date(targetDate)
      slotDateTime.setHours(h, m, 0, 0)

      if (isBefore(slotDateTime, cutoff)) return false

      // Check against existing bookings
      const isBooked = existingBookings.some(
        (b) => time < b.end_time && endTime > b.start_time
      )
      if (isBooked) return false

      // Check against partial blocks
      const isBlocked = partialBlocks.some((b) => {
        if (!b.start_time || !b.end_time) return false
        return time < b.end_time && endTime > b.start_time
      })
      if (isBlocked) return false

      return true
    })
}

export function getBookingWindow(bookingWindowDays = 90): { min: Date; max: Date } {
  const now = new Date()
  return {
    min: startOfDay(now),
    max: addDays(now, bookingWindowDays),
  }
}

export function getAvailableDates(
  schedules: Array<{ day_of_week: number; branch_id: string; doctor_id: string }>,
  doctorId: string,
  branchId: string,
  bookingWindowDays = 90
): string[] {
  const { min, max } = getBookingWindow(bookingWindowDays)
  const dates: string[] = []

  const scheduledDays = new Set(
    schedules
      .filter((s) => s.doctor_id === doctorId && s.branch_id === branchId)
      .map((s) => s.day_of_week)
  )

  let current = min
  while (!isAfter(current, max)) {
    if (scheduledDays.has(current.getDay())) {
      dates.push(format(current, 'yyyy-MM-dd'))
    }
    current = addDays(current, 1)
  }

  return dates
}
