'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminManage } from '@/lib/admin/client-actions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CheckCircle, XCircle, UserCheck, UserX, RefreshCw, Loader2 } from 'lucide-react'
import type { AppointmentWithDetails, AppointmentStatus } from '@/types/database'

interface AppointmentActionsProps {
  appointment: AppointmentWithDetails
}

export default function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [patientConfirmed, setPatientConfirmed] = useState(false)
  const [cancelNote, setCancelNote] = useState('')

  const { status } = appointment

  async function updateStatus(
    newStatus: AppointmentStatus,
    extra?: { patient_confirmed_change?: boolean; notes?: string }
  ) {
    setLoading(true)
    try {
      const prevStatus = status

      await adminManage({
        resource: 'appointment-status',
        action: 'update',
        id: appointment.id,
        payload: {
          appointment: {
            status: newStatus,
            ...(extra?.patient_confirmed_change !== undefined && {
              patient_confirmed_change: extra.patient_confirmed_change,
            }),
          },
          history: {
            appointment_id: appointment.id,
            previous_status: prevStatus,
            new_status: newStatus,
            notes: extra?.notes || null,
          },
        },
      })

      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update appointment status')
    } finally {
      setLoading(false)
      setRescheduleOpen(false)
      setCancelOpen(false)
    }
  }

  const canConfirm = status === 'reserved'
  const canAttend = status === 'confirmed' || status === 'reserved'
  const canNoShow = status === 'confirmed' || status === 'reserved'
  const canCancel = status !== 'cancelled' && status !== 'attended'
  const canReschedule = status !== 'cancelled' && status !== 'attended'

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <Button
            size="sm"
            onClick={() => updateStatus('confirmed')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Confirm
          </Button>
        )}

        {canAttend && (
          <Button
            size="sm"
            onClick={() => updateStatus('attended')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Mark Attended
          </Button>
        )}

        {canNoShow && (
          <Button
            size="sm"
            onClick={() => updateStatus('no_show', { notes: 'Marked as no-show by staff' })}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <UserX className="w-4 h-4 mr-1.5" />
            No Show
          </Button>
        )}

        {canReschedule && (
          <Button
            size="sm"
            onClick={() => setRescheduleOpen(true)}
            disabled={loading}
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reschedule
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            onClick={() => setCancelOpen(true)}
            disabled={loading}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
        )}

        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />}
      </div>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Marking as &quot;Rescheduled&quot; will free this time slot. Please create a new appointment for the patient manually.
            </p>
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Checkbox
                id="patientConfirmed"
                checked={patientConfirmed}
                onCheckedChange={(v) => setPatientConfirmed(!!v)}
              />
              <Label htmlFor="patientConfirmed" className="text-sm cursor-pointer">
                Confirmed appointment change with patient
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateStatus('rescheduled', {
                patient_confirmed_change: patientConfirmed,
                notes: patientConfirmed ? 'Rescheduled — patient confirmed change' : 'Rescheduled',
              })}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Cancelling will free this time slot and make it available for other patients.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancelNote">Reason (optional)</Label>
              <Textarea
                id="cancelNote"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep</Button>
            <Button
              onClick={() => updateStatus('cancelled', { notes: cancelNote || 'Cancelled by admin' })}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
