import { addDays, format, isAfter, isBefore, parseISO, addHours, startOfDay } from 'date-fns'
import { generateTimeSlots, getSlotEndTime } from './utils'

export interface AvailableSlot {
  time: string
  endTime: string
  isFirstComeFirstServe?: boolean
  capacity?: number
  remainingCapacity?: number
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
    first_come_first_serve?: boolean
    first_come_capacity?: number
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

  const now = new Date()
  const cutoff = addHours(now, minNoticeHours)

  if (schedule.first_come_first_serve) {
    const capacity = Math.max(1, schedule.first_come_capacity || 1)
    const scheduleStart = schedule.start_time.slice(0, 5)
    const scheduleEnd = schedule.end_time.slice(0, 5)
    const [endH, endM] = scheduleEnd.split(':').map(Number)
    const scheduleEndDateTime = new Date(targetDate)
    scheduleEndDateTime.setHours(endH, endM, 0, 0)

    if (isBefore(scheduleEndDateTime, cutoff) || isBefore(scheduleEndDateTime, now)) {
      return []
    }

    const isBlocked = partialBlocks.some((b) => {
      if (!b.start_time || !b.end_time) return false
      return scheduleStart < b.end_time && scheduleEnd > b.start_time
    })
    if (isBlocked) return []

    const bookedCount = existingBookings.filter(
      (a) =>
        a.branch_id === branchId &&
        a.start_time.slice(0, 5) >= scheduleStart &&
        a.end_time.slice(0, 5) <= scheduleEnd
    ).length
    const remainingCapacity = capacity - bookedCount
    if (remainingCapacity <= 0) return []

    return [{
      time: scheduleStart,
      endTime: scheduleEnd,
      isFirstComeFirstServe: true,
      capacity,
      remainingCapacity,
    }]
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(schedule.start_time, schedule.end_time, durationMinutes)

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
