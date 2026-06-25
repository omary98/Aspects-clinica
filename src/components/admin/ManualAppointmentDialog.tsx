'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRY_CODES, formatTime } from '@/lib/utils'
import { Loader2, Plus } from 'lucide-react'

interface ManualAppointmentDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctors: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialties: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
}

interface TimeSlot {
  time: string
  endTime: string
}

export default function ManualAppointmentDialog({
  doctors,
  specialties,
  services,
}: ManualAppointmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [doctorId, setDoctorId] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [initialStatus, setInitialStatus] = useState('confirmed')

  // Patient details
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [complaint, setComplaint] = useState('')
  const [isNewPatient, setIsNewPatient] = useState(true)
  const [notes, setNotes] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedDoctor = doctors.find((d) => d.id === doctorId) as any | undefined

  const doctorBranches = selectedDoctor
    ? Array.from(
        new Map(
          (selectedDoctor.doctor_schedule_templates || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((t: any) => t.is_active)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((t: any) => [t.branches?.id, t.branches])
        ).values()
      ).filter(Boolean)
    : []

  useEffect(() => {
    if (selectedDoctor) {
      setSpecialtyId(selectedDoctor.specialty_id || '')
      setBranchId('')
      setStartTime('')
      setSlots([])
    }
  }, [doctorId, selectedDoctor])

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !branchId || !appointmentDate) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    setStartTime('')
    try {
      const params = new URLSearchParams({
        doctorId,
        branchId,
        date: appointmentDate,
        ...(serviceId && serviceId !== 'none' && { serviceId }),
        adminMode: 'true',
      })
      const res = await fetch(`/api/availability?${params}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [doctorId, branchId, appointmentDate, serviceId])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  async function handleSubmit() {
    if (!doctorId || !branchId || !specialtyId || !appointmentDate || !startTime || !patientName.trim() || !phone.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          patient_age: patientAge ? parseInt(patientAge) : null,
          patient_phone_country_code: countryCode,
          patient_phone: phone.trim(),
          patient_email: email.trim() || null,
          doctor_id: doctorId,
          specialty_id: specialtyId,
          branch_id: branchId,
          service_id: serviceId && serviceId !== 'none' ? serviceId : null,
          appointment_date: appointmentDate,
          start_time: startTime,
          primary_complaint: complaint.trim() || null,
          is_new_patient: isNewPatient,
          notes: notes.trim() || null,
          status: initialStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create appointment')
        return
      }
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setDoctorId('')
    setSpecialtyId('')
    setBranchId('')
    setServiceId('')
    setAppointmentDate(format(new Date(), 'yyyy-MM-dd'))
    setStartTime('')
    setSlots([])
    setPatientName('')
    setPatientAge('')
    setCountryCode('+20')
    setPhone('')
    setEmail('')
    setComplaint('')
    setIsNewPatient(true)
    setNotes('')
    setInitialStatus('confirmed')
    setError('')
  }

  const relevantServices = services.filter((service) => {
    if (service.specialty_id !== specialtyId) return false
    const assignedDoctors = Array.isArray(service.service_doctors) ? service.service_doctors : []
    if (assignedDoctors.length > 0) {
      return assignedDoctors.some((row: { doctor_id: string }) => row.doctor_id === doctorId)
    }
    return service.doctor_id === null || service.doctor_id === doctorId
  })

  const canSubmit = doctorId && branchId && specialtyId && appointmentDate && startTime && patientName.trim() && phone.trim()

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-[#1B4F72] hover:bg-[#154360] text-white"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        New Appointment
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Doctor & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select value={specialtyId} onValueChange={(v) => { setSpecialtyId(v); setDoctorId('') }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Doctor <span className="text-red-500">*</span></Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors
                      .filter((d) => !specialtyId || d.specialty_id === specialtyId)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {doctorBranches.length > 0 && (
                <div className="space-y-2">
                  <Label>Branch <span className="text-red-500">*</span></Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(doctorBranches as Array<{ id: string; name_en: string }>).map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {relevantServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="General consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General consultation</SelectItem>
                      {relevantServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time slot <span className="text-red-500">*</span></Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading slots...
                  </div>
                ) : slots.length > 0 ? (
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time..." />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((s) => (
                        <SelectItem key={s.time} value={s.time}>
                          {formatTime(s.time)} – {formatTime(s.endTime)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="HH:MM"
                    />
                    {doctorId && branchId && (
                      <p className="text-xs text-gray-400">No slots found — enter time manually.</p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select value={initialStatus} onValueChange={setInitialStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Patient details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Patient Name <span className="text-red-500">*</span></Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g. 35"
                />
              </div>

              <div className="space-y-2">
                <Label>Visit Type</Label>
                <Select value={isNewPatient ? 'new' : 'followup'} onValueChange={(v) => setIsNewPatient(v === 'new')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Patient</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Phone <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
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
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XX XXX XXXX"
                    type="tel"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Email <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Complaint / Procedure</Label>
                <Textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Brief description of the patient's complaint or requested procedure..."
                  rows={2}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Notes <span className="text-gray-400 text-xs">(internal)</span></Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes for staff..."
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="bg-[#1B4F72] hover:bg-[#154360] text-white"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : (
                'Create Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
