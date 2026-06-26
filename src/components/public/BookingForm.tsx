'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRY_CODES, formatTime, getPhoneValidationMessage, normalizePhoneNumber } from '@/lib/utils'
import { getAvailableDates } from '@/lib/availability'
import { Loader2, Clock, Calendar, User, ChevronRight, ChevronLeft } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

interface BookingFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctors: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialties: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
  settings: Record<string, string>
  initialDoctorId?: string
  initialSpecialtyId?: string
}

interface TimeSlot {
  time: string
  endTime: string
  isFirstComeFirstServe?: boolean
  capacity?: number
  remainingCapacity?: number
}

type Step = 'select' | 'datetime' | 'details' | 'review'

export default function BookingForm({
  doctors,
  specialties,
  services,
  settings,
  initialDoctorId,
  initialSpecialtyId,
}: BookingFormProps) {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const isRtl = lang === 'ar'
  const BackIcon = isRtl ? ChevronRight : ChevronLeft
  const FwdIcon = isRtl ? ChevronLeft : ChevronRight
  const nameField = isRtl ? 'name_ar' : 'name_en'
  const titleField = isRtl ? 'title_ar' : 'title_en'

  // Step 1: Selection
  const [specialtyId, setSpecialtyId] = useState(initialSpecialtyId || '')
  const [doctorId, setDoctorId] = useState(initialDoctorId || '')
  const [branchId, setBranchId] = useState('')
  const [serviceId, setServiceId] = useState('')

  // Step 2: Date/Time
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))

  // Step 3: Patient details
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [complaint, setComplaint] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [isNewPatient, setIsNewPatient] = useState(true)
  const [notes, setNotes] = useState('')

  // UI state
  const [step, setStep] = useState<Step>('select')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const bookingWindowDays = parseInt(settings['booking_window_days'] || '90', 10)
  const minNoticeHours = parseInt(settings['min_notice_hours'] || '6', 10)

  const selectedDoctor = doctors.find((d) => d.id === doctorId)
  const selectedSpecialty = specialties.find((s) => s.id === specialtyId)
  const selectedService = services.find((s) => s.id === serviceId)
  const selectedBranch = selectedDoctor?.doctor_schedule_templates
    ?.flatMap((tmpl: { branches: unknown }) => [tmpl.branches])
    ?.find((b: { id: string }) => b?.id === branchId)

  useEffect(() => {
    if (selectedDoctor) {
      setSpecialtyId(selectedDoctor.specialty_id)
      setBranchId('')
      setSelectedDate('')
      setSelectedSlot(null)
      setAvailableSlots([])
    }
  }, [doctorId, selectedDoctor])

  useEffect(() => {
    if (!doctorId || !branchId) {
      setAvailableDates([])
      return
    }
    const schedules = (selectedDoctor?.doctor_schedule_templates || [])
      .filter((tmpl: { is_active: boolean }) => tmpl.is_active)
      .map((tmpl: { doctor_id: string; branch_id: string; day_of_week: number }) => ({
        doctor_id: doctorId,
        branch_id: tmpl.branch_id,
        day_of_week: tmpl.day_of_week,
      }))
    const dates = getAvailableDates(schedules, doctorId, branchId, bookingWindowDays)
    setAvailableDates(dates)
    setSelectedDate('')
    setSelectedSlot(null)
  }, [doctorId, branchId, selectedDoctor, bookingWindowDays])

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !branchId || !selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const params = new URLSearchParams({
        doctorId,
        branchId,
        date: selectedDate,
        ...(serviceId && serviceId !== 'none' && { serviceId }),
      })
      const res = await fetch(`/api/availability?${params}`)
      const data = await res.json()
      setAvailableSlots(data.slots || [])
    } catch {
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [doctorId, branchId, selectedDate, serviceId])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const doctorBranches = selectedDoctor
    ? Array.from(
        new Map(
          (selectedDoctor.doctor_schedule_templates || [])
            .filter((tmpl: { is_active: boolean }) => tmpl.is_active)
            .map((tmpl: { branches: { id: string; name_en: string; name_ar?: string } }) => [
              tmpl.branches?.id,
              tmpl.branches,
            ])
        ).values()
      ).filter(Boolean)
    : []
  const branchPalette = ['#19B7C6', '#2E8B57', '#0B8EA0', '#326B8C', '#7C4D9E']
  const branchColorMap = new Map(
    (doctorBranches as Array<{ id: string }>).map((branch, index) => [branch.id, branchPalette[index % branchPalette.length]])
  )
  const activeDoctorSchedules = (selectedDoctor?.doctor_schedule_templates || [])
    .filter((tmpl: { is_active: boolean }) => tmpl.is_active)
  const calendarGridStart = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: isRtl ? 6 : 0 })
  const calendarGridEnd = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: isRtl ? 6 : 0 })
  const monthDays = eachDayOfInterval({
    start: calendarGridStart,
    end: calendarGridEnd,
  })
  const broadAvailability = new Map<string, Array<{ id: string; name_en: string; name_ar?: string }>>()
  if (selectedDoctor) {
    eachDayOfInterval({ start: calendarGridStart, end: calendarGridEnd }).forEach((day) => {
      const branchesForDay = activeDoctorSchedules
        .filter((tmpl: { day_of_week: number }) => tmpl.day_of_week === day.getDay())
        .map((tmpl: { branches: { id: string; name_en: string; name_ar?: string } }) => tmpl.branches)
        .filter(Boolean)
      if (branchesForDay.length > 0) {
        broadAvailability.set(
          format(day, 'yyyy-MM-dd'),
          Array.from(new Map(branchesForDay.map((branch: { id: string }) => [branch.id, branch])).values()) as Array<{ id: string; name_en: string; name_ar?: string }>
        )
      }
    })
  }
  const availableDateSet = new Set(availableDates)
  const firstComeNotice = isRtl
    ? 'ملحوظة: بعض مواعيد الطبيب تعمل بنظام أولوية الحضور. الحجز يؤكد مكانك في قائمة اليوم، والحضور يكون حسب أولوية الوصول إلا إذا أوضح فريق الميديا/السنتر غير ذلك.'
    : 'Note: Some doctor sessions are first-come first-serve. Your booking confirms your place for that clinic day; arrival order applies unless the Media/Center Team specifies otherwise.'
  const hasFirstComeForSelectedBranch = !!branchId && activeDoctorSchedules.some(
    (tmpl: { branch_id: string; first_come_first_serve?: boolean }) =>
      tmpl.branch_id === branchId && tmpl.first_come_first_serve === true
  )
  const getDayLabel = (dayIndex: number) => isRtl ? t.dayNames[(dayIndex + 1) % 7] : t.dayNames[dayIndex]
  const calendarDayLabels = isRtl ? t.dayNames : t.dayNames.map((day) => day.slice(0, 3))
  const phoneValidationMessage = getPhoneValidationMessage(countryCode, phone)

  const relevantServices = services.filter((service) => {
    if (service.specialty_id !== specialtyId) return false
    const assignedDoctors = Array.isArray(service.service_doctors) ? service.service_doctors : []
    if (assignedDoctors.length > 0) {
      return assignedDoctors.some((row: { doctor_id: string }) => row.doctor_id === doctorId)
    }
    return service.doctor_id === null || service.doctor_id === doctorId
  })

  const canProceedToDateTime = doctorId && branchId && specialtyId
  const canProceedToDetails = canProceedToDateTime && selectedDate && selectedSlot
  const canSubmit = canProceedToDetails && patientName.trim() && phone.trim() && !phoneValidationMessage

  async function handleSubmit() {
    if (!canSubmit || !selectedSlot) return
    const normalizedPhone = normalizePhoneNumber(phone)
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          patient_age: patientAge ? parseInt(patientAge) : null,
          patient_phone_country_code: countryCode,
          patient_phone: normalizedPhone,
          patient_email: email.trim() || null,
          doctor_id: doctorId,
          specialty_id: specialtyId,
          branch_id: branchId,
          service_id: (serviceId && serviceId !== 'none') ? serviceId : null,
          appointment_date: selectedDate,
          start_time: selectedSlot.time,
          primary_complaint: complaint.trim() || null,
          referral_source: referralSource || null,
          is_new_patient: isNewPatient,
          notes: notes.trim() || null,
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setError(t.booking.errors.notAvailable)
        } else {
          setError(data.error || t.booking.errors.generic)
        }
        return
      }
      router.push(`/book/confirmation?id=${data.appointmentId}`)
    } catch {
      setError(t.booking.errors.network)
    } finally {
      setSubmitting(false)
    }
  }

  const steps: Step[] = ['select', 'datetime', 'details', 'review']
  const stepLabels = [t.booking.steps.select, t.booking.steps.datetime, t.booking.steps.details, t.booking.steps.review]
  const stepIndex = steps.indexOf(step)

  function getDoctorDisplayName(d: any) {
    return (d[nameField] || d.name_en) as string
  }
  function getBranchDisplayName(b: any) {
    return (b[nameField] || b.name_en) as string
  }
  function getServiceDisplayName(s: any) {
    return (s[nameField] || s.name_en) as string
  }

  return (
    <div className="aspects-booking-flow space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i <= stepIndex ? 'bg-[#1B4F72] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                i === stepIndex ? 'text-[#1B4F72] font-medium' : 'text-gray-400'
              }`}
            >
              {stepLabels[i]}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 ${i < stepIndex ? 'bg-[#1B4F72]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Doctor & Service Selection */}
      {step === 'select' && (
        <Card className="aspects-booking-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-[#1B4F72]" />
              {t.booking.step1.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{t.booking.step1.specialty}</Label>
              <Select
                value={specialtyId}
                onValueChange={(v) => { setSpecialtyId(v); setDoctorId(''); setBranchId('') }}
              >
                <SelectTrigger className="booking-select-trigger min-h-12 h-auto">
                  <SelectValue placeholder={t.booking.step1.selectSpecialty} />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s[nameField] || s.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.booking.step1.doctor}</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="booking-select-trigger min-h-12 h-auto">
                  <SelectValue placeholder={t.booking.step1.selectDoctor} />
                </SelectTrigger>
                <SelectContent>
                  {doctors
                    .filter((d) => !specialtyId || d.specialty_id === specialtyId)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <div>
                          <div className="font-medium">{getDoctorDisplayName(d)}</div>
                          <div className="text-xs text-gray-500">
                            {(d[titleField] || d.title_en) as string}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {doctorBranches.length > 0 && (
              <div className="space-y-2">
                <Label>{t.booking.step1.branch}</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.booking.step1.selectBranch} />
                  </SelectTrigger>
                  <SelectContent>
                    {(doctorBranches as Array<{ id: string; name_en: string; name_ar?: string }>).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {getBranchDisplayName(b)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{firstComeNotice}</p>
              </div>
            )}

            {selectedDoctor && broadAvailability.size > 0 && (
              <div className="aspects-booking-panel space-y-3 rounded-lg border border-amber-100 bg-[#F4FBFA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</p>
                    <p className="text-xs text-gray-500">{isRtl ? 'توافر الطبيب حسب الفروع' : 'Doctor availability by branch'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                      <BackIcon className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                      <FwdIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
                  {calendarDayLabels.map((day) => <div key={day} className="truncate">{day}</div>)}
                  {monthDays.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const branches = broadAvailability.get(dayKey) || []
                    const hasAvailability = branches.length > 0
                    const hasSelectedBranch = !!branchId && branches.some((branch) => branch.id === branchId)
                    return (
                      <button
                        type="button"
                        key={dayKey}
                        disabled={!hasAvailability}
                        onClick={() => {
                          if (branches.length === 1) setBranchId(branches[0].id)
                        }}
                        className={`min-h-12 rounded-md border text-sm transition-colors ${
                          hasAvailability
                            ? 'aspects-calendar-day bg-white text-gray-800 hover:border-[#0B8EA0]'
                            : isSameMonth(day, calendarMonth)
                              ? 'aspects-calendar-day-muted bg-white text-gray-400 opacity-50'
                              : 'aspects-calendar-day-muted bg-gray-50 text-gray-300 opacity-50'
                        } ${hasSelectedBranch ? 'ring-2 ring-[#19B7C6] border-[#19B7C6] bg-[#E6FAF6]' : isToday(day) ? 'border-[#19B7C6]' : 'border-gray-100'}`}
                      >
                        <span className="block">{format(day, 'd')}</span>
                        {hasAvailability && (
                          <span className="mt-1 flex justify-center gap-0.5">
                            {branches.slice(0, 4).map((branch) => (
                              <span key={branch.id} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: branchColorMap.get(branch.id) || '#19B7C6' }} />
                            ))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {branchId && (
                  <p className="text-xs text-gray-500">
                    {isRtl
                      ? 'الأيام المحددة بإطار مميز متاحة في الفرع الذي اخترته. الأيام الأخرى التي بها علامات ملوّنة متاحة في فروع أخرى.'
                      : 'Highlighted days are available at your selected branch. Other marked days remain visible for the doctor at other branches.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(doctorBranches as Array<{ id: string; name_en: string; name_ar?: string }>).map((branch) => (
                    <span key={branch.id} className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: branchColorMap.get(branch.id) || '#19B7C6' }} />
                      {getBranchDisplayName(branch)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {relevantServices.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {t.booking.step1.service}{' '}
                  <span className="text-gray-400 text-xs">{t.booking.step1.serviceOptional}</span>
                </Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.booking.step1.selectService} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.booking.step1.generalConsultation}</SelectItem>
                    {relevantServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getServiceDisplayName(s)}
                        {s.duration_minutes !== 20 && ` (${s.duration_minutes} min)`}
                        {s.fee && ` — ${s.fee} ${t.doctors.currency}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={() => setStep('datetime')}
              disabled={!canProceedToDateTime}
              className="w-full bg-[#1B4F72] hover:bg-[#154360] text-white"
            >
              {t.booking.step1.continue}
              <FwdIcon className="w-4 h-4 ms-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Time */}
      {step === 'datetime' && (
        <Card className="aspects-booking-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1B4F72]" />
              {t.booking.step2.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Doctor summary */}
            <div className="aspects-booking-panel flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-transparent text-sm">
              <div className="w-8 h-8 rounded-full bg-[#1B4F72] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(selectedDoctor?.name_en?.split(' ')?.[1]?.[0] || 'D').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {selectedDoctor ? getDoctorDisplayName(selectedDoctor) : ''}
                </div>
                <div className="text-gray-500 text-xs truncate">
                  {selectedBranch ? getBranchDisplayName(selectedBranch) : t.booking.step2.selectedLocation}
                </div>
              </div>
              <button
                className="text-xs text-[#1B4F72] underline flex-shrink-0"
                onClick={() => setStep('select')}
              >
                {t.booking.step2.changeDoctor}
              </button>
            </div>

            {hasFirstComeForSelectedBranch && (
              <div className="rounded-lg border border-[#19B7C6]/30 bg-[#F4FBFA] p-3 text-sm text-gray-700">
                {firstComeNotice}
              </div>
            )}

            {/* Date selection */}
            <div className="space-y-2">
              <Label>{t.booking.step2.date}</Label>
              <div className="aspects-booking-panel rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                    <BackIcon className="w-4 h-4" />
                  </Button>
                  <p className="text-sm font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                    <FwdIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
                  {calendarDayLabels.map((day) => <div key={day} className="truncate">{day}</div>)}
                  {monthDays.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const selectable = availableDateSet.has(dayKey)
                    return (
                      <button
                        type="button"
                        key={dayKey}
                        disabled={!selectable}
                        onClick={() => setSelectedDate(dayKey)}
                        className={`min-h-11 rounded-md border text-sm transition-colors ${
                          selectedDate === dayKey
                            ? 'aspects-calendar-day-selected bg-[#101010] text-white border-[#101010]'
                            : selectable
                              ? 'aspects-calendar-day bg-[#F4FBFA] text-gray-900 border-[#19B7C6]/30 hover:border-[#0B8EA0]'
                              : 'aspects-calendar-day-muted bg-gray-50 text-gray-300 border-gray-100'
                        } ${!selectable && !isSameMonth(day, calendarMonth) ? 'opacity-50' : ''}`}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>
              {selectedDate && (
                <p className="text-xs text-gray-500">
                  {getDayLabel(parseISO(selectedDate).getDay())}، {format(parseISO(selectedDate), 'd/M/yyyy')}
                </p>
              )}
              {availableDates.length === 0 && (
                <p className="text-xs text-gray-500">{t.booking.step2.noAvailableDates}</p>
              )}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.booking.step2.slots}
                  {minNoticeHours > 0 && (
                    <span className="text-xs text-gray-400 font-normal">
                      {t.booking.step2.sameDayCutoff}
                    </span>
                  )}
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.booking.step2.loadingSlots}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">{t.booking.step2.noSlots}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedSlot?.time === slot.time
                            ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                            : 'aspects-slot-button aspects-calendar-day bg-white text-gray-700 border-gray-200 hover:border-[#1B4F72] hover:text-[#1B4F72]'
                        }`}
                        dir="ltr"
                      >
                        {slot.isFirstComeFirstServe
                          ? (
                            <span className="flex flex-col gap-0.5" dir={isRtl ? 'rtl' : 'ltr'}>
                              <span>{isRtl ? 'أولوية الحضور' : 'First-come'}</span>
                              <span className="text-xs opacity-80">
                                {formatTime(slot.time)} – {formatTime(slot.endTime)}
                              </span>
                              {typeof slot.remainingCapacity === 'number' && (
                                <span className="text-xs opacity-80">
                                  {isRtl ? `${slot.remainingCapacity} أماكن متاحة` : `${slot.remainingCapacity} spots left`}
                                </span>
                              )}
                            </span>
                          )
                          : formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                <BackIcon className="w-4 h-4 me-1" />
                {t.booking.step2.back}
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!canProceedToDetails}
                className="flex-1 bg-[#1B4F72] hover:bg-[#154360] text-white"
              >
                {t.booking.step2.continue}
                <FwdIcon className="w-4 h-4 ms-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Patient Details */}
      {step === 'details' && (
        <Card className="aspects-booking-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-[#1B4F72]" />
              {t.booking.step3.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">
                  {t.booking.step3.fullName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={t.booking.step3.namePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">{t.booking.step3.age}</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder={t.booking.step3.agePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.booking.step3.patientType}</Label>
                <div className="flex gap-4 pt-1">
                  {[
                    { value: true, label: t.booking.step3.newPatient },
                    { value: false, label: t.booking.step3.followUp },
                  ].map((opt) => (
                    <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="patientType"
                        checked={isNewPatient === opt.value}
                        onChange={() => setIsNewPatient(opt.value)}
                        className="text-[#1B4F72]"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>
                  {t.booking.step3.phone} <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-36 flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(normalizePhoneNumber(e.target.value))}
                    placeholder={t.booking.step3.phonePlaceholder}
                    type="tel"
                    className="flex-1"
                  />
                </div>
                {phoneValidationMessage && (
                  <p className="text-xs text-red-600">{phoneValidationMessage}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">
                  {t.booking.step3.email}{' '}
                  <span className="text-gray-400 text-xs">{t.booking.step3.emailNote}</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="complaint">{t.booking.step3.complaint}</Label>
                <Textarea
                  id="complaint"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder={t.booking.step3.complaintPlaceholder}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.booking.step3.referral}</Label>
                <Select value={referralSource} onValueChange={setReferralSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="..." />
                  </SelectTrigger>
                  <SelectContent>
                    {t.referralSources.map((r, i) => (
                      <SelectItem key={i} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">
                  {t.booking.step3.notes}{' '}
                  <span className="text-gray-400 text-xs">{t.booking.step3.notesOptional}</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.booking.step3.notesPlaceholder}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('datetime')} className="flex-1">
                <BackIcon className="w-4 h-4 me-1" />
                {t.booking.step3.back}
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!patientName.trim() || !phone.trim() || !!phoneValidationMessage}
                className="flex-1 bg-[#1B4F72] hover:bg-[#154360] text-white"
              >
                {t.booking.step3.reviewBooking}
                <FwdIcon className="w-4 h-4 ms-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 'review' && selectedSlot && (
        <Card className="aspects-booking-card">
          <CardHeader>
            <CardTitle className="text-lg">{t.booking.step4.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="aspects-review-panel bg-blue-50 rounded-xl border border-transparent p-5 space-y-3">
              <h3 className="font-semibold text-[#1B4F72] mb-3">{t.booking.step4.appointmentDetails}</h3>
              <Row label={t.booking.step4.doctor} value={selectedDoctor ? getDoctorDisplayName(selectedDoctor) : undefined} />
              <Row label={t.booking.step4.specialty} value={selectedSpecialty ? (selectedSpecialty[nameField] || selectedSpecialty.name_en) : undefined} />
              <Row label={t.booking.step4.location} value={selectedBranch ? getBranchDisplayName(selectedBranch) : undefined} />
              {selectedService && (
                <Row label={t.booking.step4.service} value={getServiceDisplayName(selectedService)} />
              )}
              <Row
                label={t.booking.step4.date}
                value={format(parseISO(selectedDate), 'd/M/yyyy')}
              />
              <Row
                label={t.booking.step4.time}
                value={selectedSlot.isFirstComeFirstServe
                  ? (isRtl
                    ? `أولوية الحضور (${formatTime(selectedSlot.time)} – ${formatTime(selectedSlot.endTime)})`
                    : `First-come first-serve (${formatTime(selectedSlot.time)} – ${formatTime(selectedSlot.endTime)})`)
                  : `${formatTime(selectedSlot.time)} – ${formatTime(selectedSlot.endTime)}`}
                ltr={!selectedSlot.isFirstComeFirstServe}
              />
            </div>

            <div className="aspects-review-panel bg-gray-50 rounded-xl border border-transparent p-5 space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3">{t.booking.step4.patientInfo}</h3>
              <Row label={t.booking.step4.name} value={patientName} />
              {patientAge && <Row label={t.booking.step4.type} value={patientAge} />}
              <Row label={t.booking.step4.phoneLabel} value={`${countryCode} ${phone}`} ltr />
              {email && <Row label={t.booking.step4.emailLabel} value={email} ltr />}
              <Row
                label={t.booking.step4.type}
                value={isNewPatient ? t.booking.step4.newPatient : t.booking.step4.followUp}
              />
              {complaint && <Row label={t.booking.step4.complaint} value={complaint} />}
              {referralSource && <Row label={t.booking.step4.referralLabel} value={referralSource} />}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="flex-1"
                disabled={submitting}
              >
                <BackIcon className="w-4 h-4 me-1" />
                {t.booking.step4.back}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex-1 bg-[#1B4F72] hover:bg-[#154360] text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t.booking.step4.confirming}
                  </>
                ) : (
                  t.booking.step4.confirm
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center">{t.booking.step4.policy}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  ltr,
}: {
  label: string
  value: string | number | undefined | null
  ltr?: boolean
}) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`font-medium text-gray-900 text-end ${ltr ? 'dir-ltr' : ''}`} dir={ltr ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  )
}
